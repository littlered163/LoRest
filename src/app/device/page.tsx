"use client";

import Link from "next/link";
import {
  BedDouble,
  BatteryMedium,
  Bluetooth,
  Cpu,
  ThermometerSun,
  Droplets,
  Activity,
  Moon,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Unlink,
  ArrowLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { DEVICE, SLEEP } from "@/lib/lorest/sleep";
import { useDevices, formatLastSync } from "@/lib/lorest/use-devices";

export default function DevicePage() {
  const { t } = useTranslation();
  const { primary, syncing } = useDevices();
  const online = primary?.online ?? DEVICE.connected;
  const deviceName = primary?.name ?? DEVICE.name;
  const bluetoothName = primary?.bluetoothName ?? DEVICE.bluetoothName;

  const statusRows = [
    { key: "battery", Icon: BatteryMedium, value: `${DEVICE.battery}%` },
    { key: "firmware", Icon: Cpu, value: DEVICE.firmware },
    { key: "bluetooth", Icon: Bluetooth, value: bluetoothName },
    { key: "model", Icon: BedDouble, value: deviceName },
  ] as const;

  const quick = [
    { href: "/report", Icon: Activity, title: "goReport", sub: "goReportSub", el: "device-go-report" },
    { href: "/companion", Icon: Moon, title: "goCompanion", sub: "goCompanionSub", el: "device-go-companion" },
  ] as const;

  const manage = [
    { key: "reconnect", Icon: RefreshCw },
    { key: "calibrate", Icon: SlidersHorizontal },
    { key: "unbind", Icon: Unlink },
  ] as const;

  return (
    <ScreenShell label="我的设备">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          data-el="device-back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border"
          style={{ background: "rgba(255,255,255,.4)", backdropFilter: "blur(16px)" }}
          aria-label={t("device.title")}
        >
          <ArrowLeft className="h-5 w-5 text-[#7D726D]" />
        </Link>
        <h1 className="flex-1 font-heading text-[28px] font-semibold leading-tight">{t("device.title")}</h1>
        <LorestLangToggle />
      </header>

      {/* Connection hero */}
      <section className="lorest-card lorest-card-strong p-[18px]" data-el="device-hero">
        <div className="flex items-center gap-4">
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
            style={{ background: "radial-gradient(circle,#fff,#AEC2CE 72%,#9CB79A)" }}
          >
            <BedDouble className="h-7 w-7 text-white/90" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-heading text-[19px]">{deviceName}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#6E8390]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: online ? "#7FB08A" : "#C9857B" }}
                aria-hidden
              />
              {t(online ? "device.connected" : "device.disconnected")}
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {syncing
                ? t("device.syncing")
                : primary
                  ? t("device.lastSync", { time: formatLastSync(primary.lastSyncAt, t) })
                  : t("device.lastSync", { time: DEVICE.lastSyncLabel })}
            </div>
          </div>
        </div>
      </section>

      {/* Status grid */}
      <section className="lorest-card mt-4 p-[18px]" data-el="device-status">
        <h2 className="font-heading text-[17px]">{t("device.statusTitle")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {statusRows.map(({ key, Icon, value }) => (
            <div key={key} className="min-w-0 rounded-2xl p-3.5" style={{ background: "rgba(255,252,247,.5)" }}>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {t(`device.${key}`)}
              </div>
              <div className="mt-1.5 truncate text-[15px] font-semibold text-[#5F554F]">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Environment */}
      <section className="lorest-card mt-4 p-[18px]" data-el="device-env">
        <h2 className="font-heading text-[17px]">{t("device.envTitle")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(228,205,160,.22)" }}>
            <ThermometerSun className="mx-auto h-5 w-5 text-[#C0972F]" aria-hidden />
            <div className="mt-1.5 text-[22px] font-bold" style={{ letterSpacing: "-.03em" }}>{SLEEP.roomTemp}℃</div>
            <div className="text-[12px] text-muted-foreground">{t("device.roomTemp")} · {t("device.tempComfort")}</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(174,194,206,.24)" }}>
            <Droplets className="mx-auto h-5 w-5 text-[#6E8390]" aria-hidden />
            <div className="mt-1.5 text-[22px] font-bold" style={{ letterSpacing: "-.03em" }}>{SLEEP.humidity}%</div>
            <div className="text-[12px] text-muted-foreground">{t("device.humidity")}</div>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-[1.6] text-muted-foreground">{t("device.envNote")}</p>
      </section>

      {/* Quick links */}
      <section className="mt-4 grid gap-3" data-el="device-quick">
        <div className="px-1 text-[13px] text-muted-foreground">{t("device.quickTitle")}</div>
        {quick.map(({ href, Icon, title, sub, el }) => (
          <Link key={href} href={href} className="lorest-card flex items-center gap-3 p-4" data-el={el}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: "rgba(156,183,154,.3)" }}>
              <Icon className="h-5 w-5 text-[#8E6A5E]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-[15px]">{t(`device.${title}`)}</div>
              <div className="truncate text-[13px] text-muted-foreground">{t(`device.${sub}`)}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#B7ADA6]" aria-hidden />
          </Link>
        ))}
      </section>

      {/* Manage */}
      <section className="lorest-card mt-4 overflow-hidden p-0" data-el="device-manage">
        {manage.map(({ key, Icon }, i) => (
          <button
            key={key}
            type="button"
            className="flex w-full items-center gap-3 px-[18px] py-4 text-left"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
            data-el={`device-manage-${key}`}
          >
            <Icon className={`h-4.5 w-4.5 ${key === "unbind" ? "text-[#C9857B]" : "text-[#9A8E86]"}`} aria-hidden />
            <span className={`flex-1 text-[15px] ${key === "unbind" ? "text-[#C9857B]" : "text-[#5F554F]"}`}>
              {t(`device.${key}`)}
            </span>
            <ChevronRight className="h-5 w-5 text-[#B7ADA6]" aria-hidden />
          </button>
        ))}
      </section>
    </ScreenShell>
  );
}
