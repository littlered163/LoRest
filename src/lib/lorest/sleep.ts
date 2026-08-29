// Derived presentation data for the LoRest prototype.
//
// The sleep / device signals below represent readings the smart mattress
// collects overnight — they are NOT user-entered records, so they are shown as
// deterministic derived values rather than stored per user. User-owned records
// (pregnancy profile, to-dos, check-ups) live in the database via src/lib/api.

export const AURA_BG =
  "https://cdn.eazo.ai/user-contents/design-variant-images/4e7e0e20ebb54c0f8087402a24ebdb1b.png";

export interface SleepSummary {
  score: number;
  totalSleepMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  avgHeartRate: number;
  avgBreathRate: number;
  turns: number;
  leaveBedTimes: number;
  fallAsleepMinutes: number;
  roomTemp: number;
  humidity: number;
  quality: string;
  dateLabel: string;
  // Extended pregnancy metrics
  sideLieMinutes?: number;
  wakeAfterSleepMinutes?: number;
}

export const SLEEP: SleepSummary = {
  score: 86,
  totalSleepMinutes: 432,
  deepMinutes: 108,
  lightMinutes: 210,
  remMinutes: 96,
  awakeMinutes: 18,
  avgHeartRate: 68,
  avgBreathRate: 15,
  turns: 12,
  leaveBedTimes: 1,
  fallAsleepMinutes: 16,
  roomTemp: 24,
  humidity: 52,
  quality: "良好",
  dateLabel: "8月27日",
};

export type StageKind = "awake" | "rem" | "light" | "deep";

export interface StageSegment {
  kind: StageKind;
  minutes: number;
}

export const STAGES: StageSegment[] = [
  { kind: "awake", minutes: 16 },
  { kind: "light", minutes: 44 },
  { kind: "deep", minutes: 52 },
  { kind: "rem", minutes: 22 },
  { kind: "light", minutes: 60 },
  { kind: "deep", minutes: 30 },
  { kind: "rem", minutes: 28 },
  { kind: "light", minutes: 46 },
  { kind: "awake", minutes: 8 },
  { kind: "light", minutes: 32 },
  { kind: "rem", minutes: 24 },
  { kind: "deep", minutes: 26 },
  { kind: "light", minutes: 24 },
];

export const HEART_CURVE = [72, 68, 63, 59, 58, 61, 57, 60, 64, 62, 66, 71];
export const BREATH_CURVE = [16, 15, 14, 13, 13, 14, 13, 14, 15, 14, 15, 16];

export const STAGE_COLORS: Record<StageKind, string> = {
  deep: "#7F9AA6",
  light: "#E7C6C0",
  rem: "#E4CDA0",
  awake: "rgba(180,168,158,0.5)",
};

// ---- Pregnancy reference data (derived from week; not user-owned) ----
export const TOTAL_WEEKS = 40;
export const DEFAULT_DUE_DATE = "12月17日";

export interface WeekInfo {
  daysToDue: number;
  babyLengthCm: number;
  babyWeightG: number;
  fruitZh: string;
  fruitEn: string;
}

export function weekInfo(week: number): WeekInfo {
  const daysToDue = Math.max(0, (TOTAL_WEEKS - week) * 7);
  // Simple monotonic growth model for the prototype.
  const babyLengthCm = Math.round(week * 1.25 + 0.5);
  const babyWeightG = Math.round(Math.pow(week / 10, 2.6) * 40);
  const fruits: Array<{ zh: string; en: string }> = [
    { zh: "柠檬", en: "a lemon" },
    { zh: "牛油果", en: "an avocado" },
    { zh: "玉米", en: "an ear of corn" },
    { zh: "茄子", en: "an eggplant" },
    { zh: "白菜", en: "a cabbage" },
    { zh: "菠萝", en: "a pineapple" },
  ];
  const fruit = fruits[Math.min(fruits.length - 1, Math.max(0, Math.floor((week - 14) / 5)))];
  return { daysToDue, babyLengthCm, babyWeightG, fruitZh: fruit.zh, fruitEn: fruit.en };
}

export interface WeekTip {
  id: string;
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
}

export const WEEK_TIPS: WeekTip[] = [
  {
    id: "sleep-side",
    titleZh: "试试左侧卧",
    titleEn: "Try left-side sleeping",
    bodyZh: "左侧卧有助于改善血液循环，可调节床垫的侧卧支撑获得更舒适的体验。",
    bodyEn: "Left-side sleeping improves circulation; adjust your mattress for better side-sleep support.",
  },
  {
    id: "hydrate",
    titleZh: "白天多补水",
    titleEn: "Hydrate during the day",
    bodyZh: "睡前 1 小时少喝水，减少夜间起夜，睡眠更连贯。",
    bodyEn: "Ease off fluids an hour before bed to reduce night waking.",
  },
  {
    id: "kick",
    titleZh: "感受胎动",
    titleEn: "Feel the movements",
    bodyZh: "这周宝宝更活跃了，安静下来时轻轻感受一下。",
    bodyEn: "Baby is more active this week — pause and gently notice the kicks.",
  },
];

export function weekTips(week: number): WeekTip[] {
  if (week < 13) {
    return [
      {
        id: "early-rest",
        titleZh: "优先保证休息",
        titleEn: "Prioritize rest",
        bodyZh: "孕早期更容易疲惫，白天可以安排短休，睡前减少屏幕刺激。",
        bodyEn: "Fatigue is common early on. Add short rests and reduce screen time before bed.",
      },
      {
        id: "nausea",
        titleZh: "少量多餐",
        titleEn: "Small frequent meals",
        bodyZh: "睡前避免过饱，可以准备苏打饼干或温水，缓解夜间反胃。",
        bodyEn: "Avoid heavy meals before bed; crackers or warm water may ease nausea.",
      },
    ];
  }
  if (week < 24) {
    return [
      {
        id: "movement",
        titleZh: "保持温和活动",
        titleEn: "Keep gentle movement",
        bodyZh: "每天散步 20 到 30 分钟，有助于循环和夜间入睡。",
        bodyEn: "A 20 to 30 minute walk supports circulation and sleep onset.",
      },
      {
        id: "side-sleep",
        titleZh: "练习侧卧睡姿",
        titleEn: "Practice side-sleeping",
        bodyZh: "可以调节床垫的侧卧支撑角度，减轻腰背牵拉感。",
        bodyEn: "Adjust your mattress side-sleep support angle to ease back and hip tension.",
      },
    ];
  }
  if (week < 32) {
    return [
      {
        id: "left-side",
        titleZh: "左侧卧更安心",
        titleEn: "Left-side rest helps",
        bodyZh: "孕中后期推荐左侧卧，能减轻下腔静脉受压，改善胎盘供血。",
        bodyEn: "Left-side sleeping can reduce vena cava pressure and support placental blood flow.",
      },
      {
        id: "calcium",
        titleZh: "关注腿抽筋",
        titleEn: "Watch leg cramps",
        bodyZh: "睡前轻柔拉伸小腿，按医嘱补充钙和维生素 D。",
        bodyEn: "Gentle calf stretches before bed may help; follow your clinician's supplement guidance.",
      },
    ];
  }
  return [
    {
      id: "swelling",
      titleZh: "缓解水肿",
      titleEn: "Ease swelling",
      bodyZh: "睡前把双腿稍微垫高，减少久坐久站，白天保持适量饮水。",
      bodyEn: "Elevate your legs before bed, avoid long standing, and hydrate during the day.",
    },
    {
      id: "birth-bag",
      titleZh: "准备待产包",
      titleEn: "Prepare the birth bag",
      bodyZh: "把证件、产检资料、哺乳用品和新生儿衣物放在固定位置。",
      bodyEn: "Keep documents, checkup records, feeding supplies, and newborn clothes ready.",
    },
  ];
}

// ---- Today page: week-based care advice ----
interface WeekAdviceEntry {
  minWeek: number;
  titleZh: string; titleEn: string;
  pillZh: string;  pillEn: string;
  bodyZh: string;  bodyEn: string;
}

const WEEK_ADVICE_TABLE: WeekAdviceEntry[] = [
  {
    minWeek: 4,
    titleZh: "今日关怀", titleEn: "Today's care",
    pillZh: "早期舒缓", pillEn: "Early rest",
    bodyZh: "孕早期适合多卧床休息，避免长时间站立。睡前做简单拉伸，帮助身体放松入睡。",
    bodyEn: "Early pregnancy calls for more rest. Gentle stretches before bed help your body unwind.",
  },
  {
    minWeek: 13,
    titleZh: "今日关怀", titleEn: "Today's care",
    pillZh: "活动适量", pillEn: "Gentle movement",
    bodyZh: "孕中期可以适当散步，每天 20–30 分钟有助于改善血液循环。侧卧时双腿间夹枕头更舒适。",
    bodyEn: "A 20–30 min walk helps circulation. A pillow between your knees makes side-sleeping more comfortable.",
  },
  {
    minWeek: 24,
    titleZh: "今日关怀", titleEn: "Today's care",
    pillZh: "侧卧更安心", pillEn: "Left-side rest",
    bodyZh: "推荐左侧卧，有助于减轻子宫对下腔静脉的压迫，改善宝宝供血。白天可以适当午睡 20 分钟。",
    bodyEn: "Left-side sleeping eases pressure on the vena cava and improves blood flow to baby. A short nap helps too.",
  },
  {
    minWeek: 32,
    titleZh: "今日关怀", titleEn: "Today's care",
    pillZh: "关注水肿", pillEn: "Watch swelling",
    bodyZh: "孕晚期腿部水肿较常见，睡前可将双腿稍稍抬高，减少久坐久站，白天适量补水。",
    bodyEn: "Leg swelling is common now. Elevate your legs before bed, limit long sitting, and stay hydrated.",
  },
  {
    minWeek: 37,
    titleZh: "今日关怀", titleEn: "Today's care",
    pillZh: "临近预产期", pillEn: "Nearly there",
    bodyZh: "已进入足月期，注意观察胎动变化，有规律宫缩或破水时及时就医。保持作息规律，好好休息。",
    bodyEn: "You're full term. Track fetal movements and go to hospital for regular contractions or water breaking. Rest well.",
  },
];

export function weekAdvice(week: number, zh: boolean): { title: string; pill: string; body: string } {
  let entry = WEEK_ADVICE_TABLE[0];
  for (const e of WEEK_ADVICE_TABLE) {
    if (week >= e.minWeek) entry = e;
  }
  return {
    title: zh ? entry.titleZh : entry.titleEn,
    pill: zh ? entry.pillZh : entry.pillEn,
    body: zh ? entry.bodyZh : entry.bodyEn,
  };
}

// ---- Companion breathing config ----
export type SoundKey = "forest" | "rain" | "water" | "night";
export const SOUNDS: SoundKey[] = ["forest", "rain", "water", "night"];

export const BREATH_PHASES = [
  { key: "inhale", seconds: 4 },
  { key: "hold", seconds: 7 },
  { key: "exhale", seconds: 8 },
] as const;
export const BREATH_TOTAL_ROUNDS = 4;

export const DEVICE = {
  name: "荷眠智能床垫 Z1",
  connected: true,
  model: "Z1",
  firmware: "v2.4.1",
  battery: 79,
  lastSyncLabel: "今天 07:12",
  bluetoothName: "LoRest-Z1-8F3A",
};

export function formatHm(minutes: number, zh = true): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (zh) {
    if (h === 0) return `${m}分钟`;
    return m === 0 ? `${h}小时` : `${h}小时${m}分钟`;
  }
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// A gentle, pregnancy-themed nickname pool. We pick a stable one from the
// user id (so the same user always sees the same nickname) — or a session
// random one when signed out — instead of showing the real account name.
const NICKNAMES_ZH = ["小荷", "月光", "晚安宝贝", "云朵", "小星", "暖暖", "小鹿", "阿眠", "棉花糖", "小满"];
const NICKNAMES_EN = ["Lotus", "Moonlight", "Dreamer", "Cloud", "Star", "Cozy", "Fawn", "Sleepy", "Marshmallow", "Willow"];

export function randomNickname(seed: string | null | undefined, zh: boolean): string {
  const pool = zh ? NICKNAMES_ZH : NICKNAMES_EN;
  const key = seed && seed.length > 0 ? seed : "guest";
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

/**
 * The name to show for a signed-in user: prefer their real display name, then
 * the local part of their email, else empty. Never invent a nickname — an
 * empty string signals "not signed in" so callers can show a proper fallback.
 */
export function displayName(
  user: { name?: string | null; email?: string | null } | null | undefined,
): string {
  if (!user) return "";
  const name = user.name?.trim();
  if (name) return name;
  const email = user.email?.trim();
  if (email) return email.split("@")[0];
  return "";
}

