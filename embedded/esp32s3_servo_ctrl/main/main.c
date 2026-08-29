/*
 * Step1~4 清醒/睡着双模式控制固件 —— ESP32-S3-N16R8
 *
 * 清醒状态(AWAKE):
 *   摇杆X -> 舵机1: 左推=顺时针匀速, 右推=逆时针匀速, 松开=停止
 *   摇杆Y -> 舵机2: 一方向正转, 另一方向反转, 松开=停止 (与舵机1完全独立)
 *   ICM陀螺Gy -> 舵机3: 正向旋转=正转, 负向=反转, 静止=停止 (死区+上电零偏校准)
 *   压力传感器: 不参与任何控制
 * 睡着状态(SLEEP):
 *   摇杆锁定: 舵机1/2 强制停止
 *   陀螺锁定: ICM 不控制舵机3
 *   舵机3 <- 压力变化趋势(EMA滤波+死区): 压力增大=正转, 减小=反转, 不变=停止
 *            旋转速度恒定, 压力变化持续多久转多久(变化越大转得越久)
 * 模式切换: GPIO7模块按键 或 GPIO3摇杆按压, 消抖, 切换安全序列同Step2
 * 压力自诊断: AO读数持续贴满量程/零超过3秒 -> 串口告警硬件故障, 恢复后自动报告
 *
 * 串口 115200, DATA 行 250ms 一次
 */
#include <stdio.h>
#include <string.h>
#include <math.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "driver/ledc.h"
#include "driver/spi_master.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_chip_info.h"
#include "esp_flash.h"
#include "esp_heap_caps.h"
#include "esp_idf_version.h"
#include "soc/gpio_num.h"

/* ================= 引脚定义 ================= */
#define PIN_JOY_X    GPIO_NUM_1
#define PIN_JOY_Y    GPIO_NUM_2
#define PIN_JOY_SW   GPIO_NUM_3
#define PIN_SRV1     GPIO_NUM_4
#define PIN_SRV2     GPIO_NUM_5
#define PIN_PRESS    GPIO_NUM_6
#define PIN_BTN      GPIO_NUM_7
#define PIN_MOSI     GPIO_NUM_9
#define PIN_MISO     GPIO_NUM_12
#define PIN_SCLK     GPIO_NUM_10
#define PIN_CS       GPIO_NUM_11
#define PIN_SRV3     GPIO_NUM_18

/* ================= 控制参数 ================= */
#define SERVO_FREQ_HZ      50
#define SERVO_STOP_US      1500
#define SERVO_SPEED_US     150     /* 匀速旋转脉宽偏移, 可调速度 */
#define JOY_DEADZONE       200     /* 摇杆死区(ADC计数) */
#define GYRO_DPS_TH        25      /* 舵机3死区: 度/秒 (留足抗振余量) */
#define GYRO_LSB_PER_DPS   131.0f  /* ±250dps 量程 */
#define GYRO_CAL_SAMPLES   200     /* 零偏校准采样数 */
#define PRESS_FILT_ALPHA   0.2f    /* 压力EMA滤波系数(越小越平滑) */
#define PRESS_RATE_DZ      8.0f    /* 压力趋势死区: 每100ms变化量(ADC计数) */
#define PRESS_STUCK_HI     4090    /* 压力自诊断: 视为贴满量程的阈值 */
#define PRESS_STUCK_LO        5    /* 压力自诊断: 视为贴零的阈值 */
#define PRESS_STUCK_TICKS  300     /* 压力自诊断: 持续贴边拍数(约3秒)判定故障 */
#define DIR_PRESS_UP_IS_CW 1       /* 压力增大=舵机3正转(实测反了改0) */

/* 方向翻转开关(实测后如发现反向, 改这里) */
#define DIR_SRV1_LEFT_IS_CW   1
#define DIR_SRV2_UP_IS_CW     1
#define DIR_SRV3_POS_IS_CW    1

#define LEDC_RES           LEDC_TIMER_14_BIT
#define LEDC_MAX_DUTY      (1 << 14)

#define ICM_WHO_AM_I_REG  0x75
#define ICM_PWR_MGMT_1    0x6B
#define ICM_GYRO_XOUT_H   0x43   /* InvenSense表: Gx=0x43, Gy=0x45, Gz=0x47 (0x47是Z轴!) */

typedef enum { MODE_AWAKE = 0, MODE_SLEEP = 1 } sys_mode_t;

static sys_mode_t s_mode = MODE_AWAKE;
static int  s_press_baseline = 0;
static int  s_motion_dir[3] = {0};        /* -1/0/+1 */

static adc_oneshot_unit_handle_t s_adc1;
static spi_device_handle_t s_icm;
static uint8_t s_whoami = 0;

/* 校准结果 */
static int  s_joy_mid_x = 1850, s_joy_mid_y = 1865;
static float s_gyro_bias = 0;

/* 当前输出脉宽 */
static int s_pulse[3] = {1500, 1500, 1500};

/* 压力趋势滤波(Step4: 睡着状态舵机3) */
static float s_press_filt   = 0;      /* EMA滤波后压力 */
static float s_filt_hist[10] = {0};   /* 100ms前的滤波值(算变化率) */
static int   s_filt_idx     = 0;
static float s_press_rate   = 0;      /* 每100ms变化量(诊断输出) */
static int   s_press_stuck_cnt = 0;   /* 压力自诊断: 连续贴边拍数 */
static int   s_press_fault    = 0;   /* 压力自诊断: 1=疑似硬件故障 */

/* ---------------- 底层驱动 ---------------- */
static void servo_apply(int idx)
{
    int duty = (int)((long long)s_pulse[idx] * LEDC_MAX_DUTY / (1000000 / SERVO_FREQ_HZ));
    ledc_set_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)idx, duty);
    ledc_update_duty(LEDC_LOW_SPEED_MODE, (ledc_channel_t)idx);
}

static void servo_stop_all(void)
{
    for (int i = 0; i < 3; i++) {
        s_pulse[i] = SERVO_STOP_US;
        s_motion_dir[i] = 0;
        servo_apply(i);
    }
}

static void servo_init(void)
{
    ledc_timer_config_t t = {
        .speed_mode      = LEDC_LOW_SPEED_MODE,
        .duty_resolution = LEDC_RES,
        .timer_num       = LEDC_TIMER_0,
        .freq_hz         = SERVO_FREQ_HZ,
        .clk_cfg         = LEDC_AUTO_CLK,
    };
    ledc_timer_config(&t);

    const gpio_num_t pins[3] = {PIN_SRV1, PIN_SRV2, PIN_SRV3};
    for (int i = 0; i < 3; i++) {
        ledc_channel_config_t c = {
            .gpio_num   = pins[i],
            .speed_mode = LEDC_LOW_SPEED_MODE,
            .channel    = (ledc_channel_t)i,
            .intr_type  = LEDC_INTR_DISABLE,
            .timer_sel  = LEDC_TIMER_0,
            .duty       = 0,
            .hpoint     = 0,
        };
        ledc_channel_config(&c);
    }
    servo_stop_all();
}

static esp_err_t icm_read(uint8_t reg, uint8_t *out, size_t len)
{
    uint8_t tx[16] = {0};
    uint8_t rx[16] = {0};
    tx[0] = reg | 0x80;
    spi_transaction_t t = {0};
    t.length    = (len + 1) * 8;
    t.rxlength  = (len + 1) * 8;
    t.tx_buffer = tx;
    t.rx_buffer = rx;
    gpio_set_level(PIN_CS, 0);
    esp_err_t err = spi_device_transmit(s_icm, &t);
    gpio_set_level(PIN_CS, 1);
    if (err == ESP_OK) memcpy(out, &rx[1], len);
    return err;
}

static esp_err_t icm_write(uint8_t reg, uint8_t val)
{
    uint8_t tx[2] = { (uint8_t)(reg & 0x7F), val };
    spi_transaction_t t = {0};
    t.length    = 16;
    t.tx_buffer = tx;
    gpio_set_level(PIN_CS, 0);
    esp_err_t err = spi_device_transmit(s_icm, &t);
    gpio_set_level(PIN_CS, 1);
    return err;
}

static void icm_init(void)
{
    gpio_config_t cs = {
        .pin_bit_mask = 1ULL << PIN_CS,
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_ENABLE,
    };
    gpio_config(&cs);
    gpio_set_level(PIN_CS, 1);

    spi_bus_config_t bus = {
        .mosi_io_num     = PIN_MOSI,
        .miso_io_num     = PIN_MISO,
        .sclk_io_num     = PIN_SCLK,
        .quadwp_io_num   = -1,
        .quadhd_io_num   = -1,
    };
    spi_bus_initialize(SPI2_HOST, &bus, SPI_DMA_CH_AUTO);

    spi_device_interface_config_t dev = {
        .clock_speed_hz = 1 * 1000 * 1000,
        .mode           = 0,
        .spics_io_num   = -1,
        .queue_size     = 1,
    };
    spi_bus_add_device(SPI2_HOST, &dev, &s_icm);
}

/* 读陀螺三轴原始值: gx, gy, gz */
static esp_err_t icm_read_gyro(int16_t *g)
{
    uint8_t buf[6];
    esp_err_t err = icm_read(ICM_GYRO_XOUT_H, buf, 6);
    if (err == ESP_OK) {
        g[0] = (int16_t)((buf[0] << 8) | buf[1]);
        g[1] = (int16_t)((buf[2] << 8) | buf[3]);
        g[2] = (int16_t)((buf[4] << 8) | buf[5]);
    }
    return err;
}

static void peripherals_init(void)
{
    adc_oneshot_unit_init_cfg_t init = { .unit_id = ADC_UNIT_1 };
    adc_oneshot_new_unit(&init, &s_adc1);
    adc_oneshot_chan_cfg_t ch = {
        .atten    = ADC_ATTEN_DB_12,
        .bitwidth = ADC_BITWIDTH_DEFAULT,
    };
    adc_oneshot_config_channel(s_adc1, ADC_CHANNEL_0, &ch);
    adc_oneshot_config_channel(s_adc1, ADC_CHANNEL_1, &ch);
    adc_oneshot_config_channel(s_adc1, ADC_CHANNEL_5, &ch);

    gpio_config_t io = {
        .pin_bit_mask = (1ULL << PIN_JOY_SW) | (1ULL << PIN_BTN),
        .mode         = GPIO_MODE_INPUT,
        .pull_up_en   = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_DISABLE,
    };
    gpio_config(&io);
}

/* ---------------- 上电校准 ---------------- */
static void calibrate(void)
{
    printf("[校准] 请保持静止: 摇杆居中, ICM不动 ... 最多10秒\n");
    long sx = 0, sy = 0;
    int v = 0;
    int16_t g[3] = {0};
    /* 陀螺零偏校准: 带稳定度检查, 晃动则自动重试 */
    for (int attempt = 1; attempt <= 5; attempt++) {
        long sum = 0, sumsq = 0;
        for (int i = 0; i < GYRO_CAL_SAMPLES; i++) {
            if (icm_read_gyro(g) == ESP_OK) {
                sum += g[1];
                sumsq += (long)g[1] * g[1];
            }
            vTaskDelay(pdMS_TO_TICKS(8));
        }
        float mean = (float)sum / GYRO_CAL_SAMPLES;
        float var  = (float)sumsq / GYRO_CAL_SAMPLES - mean * mean;
        float std  = sqrtf(var > 0 ? var : 0) / GYRO_LSB_PER_DPS;
        if (std < 5.0f) {                    /* 波动<5dps 才认为真正静止 */
            s_gyro_bias = mean;
            printf("[校准] 第%d次尝试: 稳定(波动%.1fdps), 零偏=%.1f\n", attempt, std, mean);
            break;
        }
        printf("[校准] 第%d次尝试: 检测到晃动(波动%.1fdps), 保持静止, 重试...\n", attempt, std);
        if (attempt == 5) s_gyro_bias = mean;
    }
    /* 摇杆中位校准(同窗口内完成) */
    for (int i = 0; i < GYRO_CAL_SAMPLES; i++) {
        adc_oneshot_read(s_adc1, ADC_CHANNEL_0, &v); sx += v;
        adc_oneshot_read(s_adc1, ADC_CHANNEL_1, &v); sy += v;
        vTaskDelay(pdMS_TO_TICKS(2));
    }
    s_joy_mid_x = (int)(sx / GYRO_CAL_SAMPLES);
    s_joy_mid_y = (int)(sy / GYRO_CAL_SAMPLES);

    /* 压力基准 */
    long sp = 0;
    for (int i = 0; i < 8; i++) {
        adc_oneshot_read(s_adc1, ADC_CHANNEL_5, &v);
        sp += v;
        vTaskDelay(pdMS_TO_TICKS(2));
    }
    s_press_baseline = (int)(sp / 8);
    /* 压力滤波器复位到当前基准 */
    s_press_filt = (float)s_press_baseline;
    for (int i = 0; i < 10; i++) s_filt_hist[i] = (float)s_press_baseline;
    s_filt_idx = 0;
    s_press_rate = 0;

    printf("[校准完成] 摇杆中位 X=%d Y=%d | 陀螺Gy零偏=%.1f | 压力基准=%d\n",
           s_joy_mid_x, s_joy_mid_y, s_gyro_bias, s_press_baseline);
}

/* ---------------- 模式切换安全序列 ---------------- */
/* 注: 陀螺控制用的是瞬时角速度(无历史缓存), 零偏漂移由主循环静止自动跟踪兜底, 无需额外清理 */

static void on_mode_switch(void)
{
    servo_stop_all();                          /* 1.停舵机 2.清方向 */
    long sum = 0; int v = 0;
    for (int i = 0; i < 8; i++) {
        adc_oneshot_read(s_adc1, ADC_CHANNEL_5, &v);
        sum += v;
        vTaskDelay(pdMS_TO_TICKS(2));
    }
    s_press_baseline = (int)(sum / 8);         /* 3.更新压力基准 */
    /* 压力滤波器同步复位, 避免切换瞬间误判趋势 */
    s_press_filt = (float)s_press_baseline;
    for (int i = 0; i < 10; i++) s_filt_hist[i] = (float)s_press_baseline;
    s_filt_idx = 0;
    s_press_rate = 0;
    printf(">>> [切换] 模式=%s | 停舵机+清方向 | 压力基准=%d\n",
           s_mode == MODE_AWAKE ? "AWAKE(清醒)" : "SLEEP(睡着)",
           s_press_baseline);
}

/* ---------------- ICM 诊断(鉴定未知芯片) ---------------- */
static void icm_diag(void)
{
    uint8_t v = 0;
    printf("[ICM诊断] 单字节寄存器扫描:\n");
    if (icm_read(0x75, &v, 1) == ESP_OK) printf("  0x75 WHO_AM_I      = 0x%02X\n", v);
    if (icm_read(0x6B, &v, 1) == ESP_OK) printf("  0x6B PWR_MGMT_1    = 0x%02X (bit6=1为睡眠)\n", v);
    if (icm_read(0x6C, &v, 1) == ESP_OK) printf("  0x6C PWR_MGMT_2    = 0x%02X (0x00=全部使能)\n", v);
    if (icm_read(0x1B, &v, 1) == ESP_OK) printf("  0x1B GYRO_CONFIG   = 0x%02X\n", v);
    if (icm_read(0x1C, &v, 1) == ESP_OK) printf("  0x1C ACCEL_CONFIG  = 0x%02X\n", v);
    uint8_t acc[6] = {0}, gyr[6] = {0}, tmp[2] = {0};
    esp_err_t e1 = icm_read(0x3B, acc, 6);
    esp_err_t e2 = icm_read(0x41, tmp, 2);
    esp_err_t e3 = icm_read(0x43, gyr, 6);
    printf("  0x3B 加速度 6字节: %s | %02X %02X %02X %02X %02X %02X\n",
           e1 == ESP_OK ? "OK" : esp_err_to_name(e1),
           acc[0], acc[1], acc[2], acc[3], acc[4], acc[5]);
    printf("  0x41 温度   2字节: %s | %02X %02X\n",
           e2 == ESP_OK ? "OK" : esp_err_to_name(e2), tmp[0], tmp[1]);
    printf("  0x43 陀螺仪 6字节: %s | %02X %02X %02X %02X %02X %02X\n",
           e3 == ESP_OK ? "OK" : esp_err_to_name(e3),
           gyr[0], gyr[1], gyr[2], gyr[3], gyr[4], gyr[5]);

    /* 尝试唤醒 + 解除睡眠后再读 */
    icm_write(0x6B, 0x00);          /* 唤醒, 内部20MHz时钟 */
    icm_write(0x6C, 0x00);          /* 使能全部加速度+陀螺 */
    vTaskDelay(pdMS_TO_TICKS(100));
    if (icm_read(0x6B, &v, 1) == ESP_OK) printf("  唤醒后 0x6B = 0x%02X\n", v);
    if (icm_read(0x6C, &v, 1) == ESP_OK) printf("  唤醒后 0x6C = 0x%02X\n", v);
    if (icm_read(0x43, gyr, 6) == ESP_OK)
        printf("  唤醒后 0x43 陀螺: %02X %02X %02X %02X %02X %02X\n",
               gyr[0], gyr[1], gyr[2], gyr[3], gyr[4], gyr[5]);
}

/* ---------------- 主循环 ---------------- */
void app_main(void)
{
    printf("\n\n============================================\n");
    printf("  ESP32-S3 Step1~4 清醒/睡着双模式固件\n");
    printf("============================================\n");

    esp_chip_info_t ci;
    esp_chip_info(&ci);
    uint32_t flash_mb = 0;
    esp_flash_get_size(NULL, &flash_mb);
    flash_mb /= (1024 * 1024);
    size_t psram_kb = heap_caps_get_total_size(MALLOC_CAP_SPIRAM) / 1024;
    printf("[芯片] %s 核心%d | Flash: %uMB | PSRAM: %uKB | IDF: %s\n",
           (ci.model == CHIP_ESP32S3) ? "ESP32-S3" : "OTHER",
           ci.cores, (unsigned)flash_mb, (unsigned)psram_kb, esp_get_idf_version());

    peripherals_init();
    icm_init();
    servo_init();

    uint8_t who = 0;
    if (icm_read(ICM_WHO_AM_I_REG, &who, 1) == ESP_OK) {
        s_whoami = who;
        printf("[ICM] WHO_AM_I = 0x%02X (期望 0x12)\n", who);
        icm_diag();
    }

    calibrate();

    printf("[规则] 清醒: 摇杆X=舵机1 摇杆Y=舵机2 陀螺Gy=舵机3 | 睡着: 摇杆/陀螺锁定, 舵机3<-压力趋势\n");
    printf("[规则] 舵机速度固定 %dus (1=%+d/-%d)\n", SERVO_SPEED_US, SERVO_SPEED_US, SERVO_SPEED_US);
    printf("--------------------------------------------\n\n");

    int btn_stable = 1, btn_low_cnt = 0;
    int sw_stable = 1, sw_low_cnt = 0;
    int cnt = 0;
    int last_raw7 = -1, last_raw3 = -1;
    int16_t gyro[3] = {0};

    while (1) {
        int raw7 = gpio_get_level(PIN_BTN);
        int raw3 = gpio_get_level(PIN_JOY_SW);
        if (raw7 != last_raw7 || raw3 != last_raw3) {
            printf("BTN_RAW n=%d btn7=%d joySW=%d\n", cnt, raw7, raw3);
            last_raw7 = raw7;
            last_raw3 = raw3;
        }

        /* 按键消抖(双通道) */
        int trig = 0;
        int level = raw7;
        if (level == 0) {
            if (btn_low_cnt < 100) btn_low_cnt++;
            if (btn_low_cnt == 3 && btn_stable == 1) { btn_stable = 0; trig = 1; }
        } else {
            if (btn_low_cnt >= 3) btn_stable = 1;
            btn_low_cnt = 0;
        }
        if (!trig) {
            level = raw3;
            if (level == 0) {
                if (sw_low_cnt < 100) sw_low_cnt++;
                if (sw_low_cnt == 3 && sw_stable == 1) { sw_stable = 0; trig = 1; }
            } else {
                if (sw_low_cnt >= 3) sw_stable = 1;
                sw_low_cnt = 0;
            }
        }
        if (trig) {
            s_mode = (s_mode == MODE_AWAKE) ? MODE_SLEEP : MODE_AWAKE;
            on_mode_switch();
        }

        /* ---- 传感器采集(每拍) ---- */
        int jx = 0, jy = 0, press = 0;
        adc_oneshot_read(s_adc1, ADC_CHANNEL_0, &jx);
        adc_oneshot_read(s_adc1, ADC_CHANNEL_1, &jy);
        adc_oneshot_read(s_adc1, ADC_CHANNEL_5, &press);
        int gyro_ok = (icm_read_gyro(gyro) == ESP_OK);
        float gy_dps = gyro_ok ? ((float)gyro[1] - s_gyro_bias) / GYRO_LSB_PER_DPS : 0;

        /* 静止自动回零: |gy|<5dps 时缓慢跟踪零偏, 抵消温漂/长期漂移 */
        if (gyro_ok && fabsf(gy_dps) < 5.0f)
            s_gyro_bias += ((float)gyro[1] - s_gyro_bias) * 0.0005f;

        /* 压力EMA滤波 + 100ms变化率(两种模式都更新, 保持滤波器温热) */
        s_press_filt += PRESS_FILT_ALPHA * ((float)press - s_press_filt);
        s_press_rate = s_press_filt - s_filt_hist[s_filt_idx];
        s_filt_hist[s_filt_idx] = s_press_filt;
        s_filt_idx = (s_filt_idx + 1) % 10;

        /* 压力传感器自诊断: 读数持续贴满量程/零 -> 硬件故障告警, 恢复即报告 */
        if (press >= PRESS_STUCK_HI || press <= PRESS_STUCK_LO) {
            if (s_press_stuck_cnt < 100000) s_press_stuck_cnt++;
        } else {
            s_press_stuck_cnt = 0;
        }
        if (!s_press_fault && s_press_stuck_cnt == PRESS_STUCK_TICKS) {
            s_press_fault = 1;
            printf("[压力] *** 疑似硬件故障: p=%d 持续贴%s约3秒 ***\n",
                   press, press >= PRESS_STUCK_HI ? "满量程(AO卡3.3V,薄膜支路断路)" : "零(AO无输出,查接线)");
            printf("[压力] 排查顺序: 薄膜焊点 -> 杜邦线插AO(非DO) -> 模块VCC/GND方向\n");
        } else if (s_press_fault && s_press_stuck_cnt == 0) {
            s_press_fault = 0;
            printf("[压力] 读数恢复正常 p=%d, 睡着模式可联调舵机3\n", press);
        }

        /* ---- 控制逻辑(仅清醒状态) ---- */
        if (s_mode == MODE_AWAKE) {
            /* 舵机1 <- 摇杆X: 左推(低)=顺时针, 右推(高)=逆时针 */
            int dx = jx - s_joy_mid_x;
            if (dx < -JOY_DEADZONE) {
                s_pulse[0] = SERVO_STOP_US + (DIR_SRV1_LEFT_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                s_motion_dir[0] = DIR_SRV1_LEFT_IS_CW ? +1 : -1;
            } else if (dx > JOY_DEADZONE) {
                s_pulse[0] = SERVO_STOP_US - (DIR_SRV1_LEFT_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                s_motion_dir[0] = DIR_SRV1_LEFT_IS_CW ? -1 : +1;
            } else {
                s_pulse[0] = SERVO_STOP_US;
                s_motion_dir[0] = 0;
            }
            /* 舵机2 <- 摇杆Y (独立) */
            int dy = jy - s_joy_mid_y;
            if (dy < -JOY_DEADZONE) {
                s_pulse[1] = SERVO_STOP_US + (DIR_SRV2_UP_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                s_motion_dir[1] = DIR_SRV2_UP_IS_CW ? +1 : -1;
            } else if (dy > JOY_DEADZONE) {
                s_pulse[1] = SERVO_STOP_US - (DIR_SRV2_UP_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                s_motion_dir[1] = DIR_SRV2_UP_IS_CW ? -1 : +1;
            } else {
                s_pulse[1] = SERVO_STOP_US;
                s_motion_dir[1] = 0;
            }
            /* 舵机3 <- ICM陀螺Gy (独立, 死区) */
            if (gyro_ok) {
                if (gy_dps > GYRO_DPS_TH) {
                    s_pulse[2] = SERVO_STOP_US + (DIR_SRV3_POS_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                    s_motion_dir[2] = DIR_SRV3_POS_IS_CW ? +1 : -1;
                } else if (gy_dps < -GYRO_DPS_TH) {
                    s_pulse[2] = SERVO_STOP_US - (DIR_SRV3_POS_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                    s_motion_dir[2] = DIR_SRV3_POS_IS_CW ? -1 : +1;
                } else {
                    s_pulse[2] = SERVO_STOP_US;
                    s_motion_dir[2] = 0;
                }
            } else {
                s_pulse[2] = SERVO_STOP_US;
                s_motion_dir[2] = 0;
            }
        } else {
            /* 睡着: 舵机1/2 锁定停止, 舵机3 由压力变化趋势驱动 */
            s_pulse[0] = SERVO_STOP_US;
            s_motion_dir[0] = 0;
            s_pulse[1] = SERVO_STOP_US;
            s_motion_dir[1] = 0;
            /* 舵机3 <- 压力趋势: 增大=正转, 减小=反转, 不变=停止 (速度恒定) */
            if (s_press_rate > PRESS_RATE_DZ) {
                s_pulse[2] = SERVO_STOP_US + (DIR_PRESS_UP_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                s_motion_dir[2] = DIR_PRESS_UP_IS_CW ? +1 : -1;
            } else if (s_press_rate < -PRESS_RATE_DZ) {
                s_pulse[2] = SERVO_STOP_US - (DIR_PRESS_UP_IS_CW ? +SERVO_SPEED_US : -SERVO_SPEED_US);
                s_motion_dir[2] = DIR_PRESS_UP_IS_CW ? -1 : +1;
            } else {
                s_pulse[2] = SERVO_STOP_US;
                s_motion_dir[2] = 0;
            }
        }

        servo_apply(0);
        servo_apply(1);
        servo_apply(2);

        /* ---- 250ms 状态输出 ---- */
        if (cnt % 25 == 0) {
            printf("DATA n=%d mode=%s jx=%4d jy=%4d gy=%6.1fdps p=%4d pf=%6.1f rt=%+6.1f pulse=[%4d,%4d,%4d] dir=[%d,%d,%d] pflt=%d\n",
                   cnt / 25,
                   s_mode == MODE_AWAKE ? "AWAKE" : "SLEEP",
                   jx, jy, gy_dps, press, s_press_filt, s_press_rate,
                   s_pulse[0], s_pulse[1], s_pulse[2],
                   s_motion_dir[0], s_motion_dir[1], s_motion_dir[2],
                   s_press_fault);
        }
        cnt++;

        vTaskDelay(pdMS_TO_TICKS(10));
    }
}
