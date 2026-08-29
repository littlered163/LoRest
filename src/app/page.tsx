"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, ChevronRight, Cloud, Moon, Waves } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { ScoreRing } from "@/components/lorest/score-ring";
import { SLEEP, formatHm, displayName, weekAdvice, weekInfo } from "@/lib/lorest/sleep";
import { useDevices, formatLastSync } from "@/lib/lorest/use-devices";
import { weatherForDate, REFERENCE_TODAY } from "@/lib/lorest/history";
import { fetchProfile, type PregnancyProfileDto } from "@/lib/api";

export default function TodayPage() {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const router = useRouter();
  const { user } = useAuth();
  const name = displayName(user);
  const { primary, syncing } = useDevices();
  const online = primary?.online ?? false;
  const hasData = Boolean(user);

  const [profile, setProfile] = useState<PregnancyProfileDto | null>(null);
  useEffect(() => {
    if (!user) return;
    fetchProfile().then(setProfile).catch(() => undefined);
  }, [user]);

  const weather = weatherForDate(REFERENCE_TODAY);
  const info = profile ? weekInfo(profile.week) : null;
  const advice = profile ? weekAdvice(profile.week, zh) : null;

  return (
    <ScreenShell label="荷眠今日">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="font-heading text-[18px] font-semibold text-[#5F554F]">
          {name ? t("today.hello", { name }) : t("today.helloGuest")}
        </div>
        <LorestLangToggle />
      </header>

      {/* Weather strip */}
      <div
        data-el="today-weather"
        className="mb-3 flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
        style={{ background: "rgba(174,194,206,.22)" }}
      >
        <Cloud className="h-4 w-4 shrink-0 text-[#6E8BA0]" aria-hidden />
        <span className="text-[13px] text-[#5F7C90]">
          {zh ? weather.conditionZh : weather.conditionEn}
          {" · "}
          {weather.tempC}℃
          {" · "}
          {zh ? `湿度 ${weather.humidity}%` : `${weather.humidity}% humidity`}
        </span>
      </div>

      <Link
        href="/device"
        data-el="today-connection"
        className="lorest-card lorest-card-strong mb-3 flex items-center gap-3 p-3.5"
      >
        <span
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full"
          style={{ background: "rgba(127,176,138,.18)" }}
        >
          <BedDouble className="h-[18px] w-[18px] text-[#5E9068]" aria-hidden />
          {primary && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[rgba(255,252,247,.9)]"
              style={{ background: online ? "#7FB08A" : "#C9857B" }}
              aria-hidden
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {primary ? (
            <>
              <div className="text-[14px] font-semibold text-[#5F554F]">
                {online ? t("today.deviceConnected") : t("device.disconnected")}
              </div>
              <div className="truncate text-[12px] text-muted-foreground">
                {syncing
                  ? t("device.syncing")
                  : online
                    ? t("device.lastSync", { time: formatLastSync(primary.lastSyncAt, t) })
                    : t("device.envNote")}
              </div>
            </>
          ) : (
            <>
              <div className="text-[14px] font-semibold text-[#5F554F]">{t("device.noDevice")}</div>
              <div className="truncate text-[12px] text-muted-foreground">{t("device.noDeviceSub")}</div>
            </>
          )}
        </div>
        <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[#B7ADA6]" aria-hidden />
      </Link>

      {hasData ? (
        <>
          <section className="grid place-items-center" data-el="today-hero">
            <ScoreRing
              score={SLEEP.score}
              label={t("today.scoreLabel")}
              onClick={() => router.push("/report")}
            />
          </section>

          <Link
            href="/report"
            data-el="today-summary"
            className="lorest-card lorest-card-strong mt-3 block p-[18px]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[12px] text-muted-foreground">{t("today.sleepDurationLabel")}</div>
                <div
                  className="font-heading mt-1 text-[26px] font-bold leading-none text-[#5F554F]"
                  style={{ letterSpacing: "-.03em" }}
                >
                  {formatHm(SLEEP.totalSleepMinutes, zh)}
                </div>
              </div>
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                style={{ background: "rgba(174,194,206,.28)" }}
                aria-hidden
              >
                <Moon className="h-5 w-5 text-[#6E8BA0]" />
              </span>
            </div>

            <div className="my-3.5 h-px" style={{ background: "rgba(150,132,120,.14)" }} aria-hidden />

            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-[18px] font-semibold leading-[1.25]">
                {advice ? advice.title : t("today.adviceTitle")}
              </h2>
              <span
                className="whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs text-[#7A6E66]"
                style={{ background: "rgba(156,183,154,.34)" }}
              >
                {advice ? advice.pill : t("today.advicePill")}
              </span>
            </div>
            <p className="mt-2.5 text-[14px] leading-[1.65] text-[#776C66]">
              {advice ? advice.body : t("today.adviceBody")}
            </p>
          </Link>
        </>
      ) : (
        <section className="grid place-items-center" data-el="today-hero">
          <ScoreRing
            score={0}
            label={!user ? t("today.noDataSignIn") : t("today.noDataDevice")}
            empty
          />
        </section>
      )}

      {profile && info && (
        <Link
          href="/pregnancy"
          data-el="today-pregnancy"
          className="lorest-card lorest-card-strong mt-3 flex items-center gap-3 p-[18px]"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted-foreground">{t("today.progressTitle")}</div>
            <div className="font-heading mt-1 text-[22px] font-bold leading-none text-[#5F554F]">
              {zh ? `孕 ${profile.week} 周` : `Week ${profile.week}`}
            </div>
            <div className="mt-1.5 text-[13px] text-[#776C66]">
              {t("today.progressDue", { days: info.daysToDue })}
              {" · "}
              {zh ? `像一颗${info.fruitZh}` : `about ${info.fruitEn}`}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[28px] leading-none" aria-hidden>🌿</span>
            <ChevronRight className="h-[18px] w-[18px] text-[#B7ADA6]" aria-hidden />
          </div>
        </Link>
      )}

      <Link href="/companion" className="lorest-card flex items-center justify-between gap-4 mt-3 p-4" data-el="today-companion">
        <div>
          <h3 className="font-heading text-[16px]">{t("today.companionTitle")}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#6E625C]">
            <Waves className="h-3.5 w-3.5" aria-hidden />
            {t("today.companionSub")}
          </div>
        </div>
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
          style={{
            background: "radial-gradient(circle,#fff,#9CB79A 62%,#E4CDA0)",
            boxShadow: "0 0 28px rgba(156,183,154,.7)",
            animation: "lorest-breathe 4.7s var(--lorest-ease) infinite alternate",
          }}
          aria-hidden
        >
          <Moon className="h-5 w-5 text-white/90" />
        </span>
      </Link>
    </ScreenShell>
  );
}
