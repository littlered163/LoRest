"use client";

import { HeartPulse, RotateCcw, DoorOpen, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StageBand, StageLegend } from "@/components/lorest/stage-band";
import { formatHm } from "@/lib/lorest/sleep";
import type { reportForDay } from "@/lib/lorest/history";

type DayReport = ReturnType<typeof reportForDay>;

function Curve({ data, stroke, dotted }: { data: number[]; stroke: string; dotted?: boolean }) {
  const w = 300;
  const h = 72;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 12) - 6;
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[72px] w-full" preserveAspectRatio="none" aria-hidden>
      <path d={path} fill="none" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={dotted ? 0.5 : 0.9} strokeDasharray={dotted ? "1 5" : undefined} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.2} fill={stroke} opacity={0.85} />
      ))}
    </svg>
  );
}

/** The full single-night report body, driven by a per-day report object. */
export function DayReport({ report }: { report: DayReport }) {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const legend = {
    deep: t("report.legendDeep"),
    light: t("report.legendLight"),
    rem: t("report.legendRem"),
    awake: t("report.legendAwake"),
  };

  return (
    <>
      <section className="lorest-card lorest-card-strong p-[18px]" data-el="report-stage">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[12px] text-muted-foreground">{t("report.totalSleep")}</div>
            <div className="text-[30px] font-bold leading-none" style={{ letterSpacing: "-.04em" }}>
              {formatHm(report.totalSleepMinutes, zh)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-muted-foreground">{t("report.score")}</div>
            <div className="text-[30px] font-bold leading-none text-[#8E6A5E]" style={{ letterSpacing: "-.04em" }}>
              {report.score}
            </div>
          </div>
        </div>
        <div className="mt-4 mb-3 text-[13px] text-[#6E625C]">{t("report.stageTitle")}</div>
        <StageBand segments={report.stages} height={112} />
        <div className="mt-3">
          <StageLegend labels={legend} />
        </div>
      </section>

      <section className="lorest-card mt-4 p-[18px]" data-el="report-heart">
        <h2 className="font-heading text-[17px]">{t("report.heartTitle")}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t("report.heartRate", { bpm: report.avgHeartRate })} · {t("report.breathRate", { rpm: report.avgBreathRate })}
        </p>
        <div className="mt-3">
          <Curve data={report.heart} stroke="#E0917F" />
        </div>
        <div className="mt-1">
          <Curve data={report.breath} stroke="#7F9AA6" dotted />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>00:00</span>
          <span>24:00</span>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2.5" data-el="report-metrics">
        {[
          { Icon: RotateCcw, v: t("report.timesUnit", { count: report.turns }), s: t("report.turns") },
          { Icon: DoorOpen, v: t("report.timesUnit", { count: report.leaveBedTimes }), s: t("report.leaveBed") },
          { Icon: Timer, v: t("report.minutesUnit", { count: report.fallAsleepMinutes }), s: t("report.fallAsleep") },
        ].map((m) => (
          <div key={m.s} className="lorest-card min-w-0 px-2 py-3.5 text-center">
            <m.Icon className="mx-auto h-4 w-4 text-[#9A8E86]" aria-hidden />
            <b className="mt-1.5 block text-[16px] leading-tight">{m.v}</b>
            <span className="mt-1 block whitespace-nowrap text-[11px] text-muted-foreground">{m.s}</span>
          </div>
        ))}
      </section>

      <section className="lorest-card mt-4 p-[18px]" data-el="report-summary">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-[#E0917F]" aria-hidden />
          <h2 className="font-heading text-[17px]">{t("report.summaryTitle")}</h2>
        </div>
        <p className="mt-2.5 text-[14px] leading-[1.7] text-[#776C66]">{t("report.summaryBody")}</p>
      </section>
    </>
  );
}
