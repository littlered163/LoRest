"use client";

import { HeartPulse, RotateCcw, DoorOpen, Timer, Baby, TrendingUp, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StageBand, StageLegend } from "@/components/lorest/stage-band";
import { formatHm, weekTips } from "@/lib/lorest/sleep";
import type { reportForDay } from "@/lib/lorest/history";
import type { PregnancyProfileDto } from "@/lib/api";

type DayReport = ReturnType<typeof reportForDay> & { sideLieMinutes?: number };

interface DayReportProps {
  report: DayReport;
  profile: PregnancyProfileDto | null;
}

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

/** Sleep analysis report */
export function DayReport({ report, profile }: DayReportProps) {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const week = profile?.week ?? 28;
  const tips = weekTips(week);

  const legend = {
    deep: t("report.legendDeep"),
    light: t("report.legendLight"),
    rem: t("report.legendRem"),
    awake: t("report.legendAwake"),
  };

  // Generate sleep analysis based on data
  const sleepAnalysis = (() => {
    const items: { icon: "trending" | "moon" | "baby"; title: string; body: string; }[] = [];

    // Sleep quality analysis
    if (report.score >= 85) {
      items.push({
        icon: "trending",
        title: zh ? "睡眠质量优秀" : "Excellent sleep quality",
        body: zh
          ? `昨晚睡眠得分 ${report.score} 分，深睡占比 ${Math.round(report.deepMinutes / report.totalSleepMinutes * 100)}%，整体表现优异。`
          : `Last night scored ${report.score} points with ${Math.round(report.deepMinutes / report.totalSleepMinutes * 100)}% deep sleep.`,
      });
    } else if (report.score >= 75) {
      items.push({
        icon: "trending",
        title: zh ? "睡眠质量良好" : "Good sleep quality",
        body: zh
          ? `昨晚睡眠得分 ${report.score} 分，睡眠时长 ${formatHm(report.totalSleepMinutes, zh)}，各方面表现不错。`
          : `Last night scored ${report.score} points with ${formatHm(report.totalSleepMinutes, zh)} of sleep.`,
      });
    } else {
      items.push({
        icon: "trending",
        title: zh ? "睡眠质量有待提升" : "Room for improvement",
        body: zh
          ? `昨晚睡眠得分 ${report.score} 分，建议关注睡前环境和入睡时间。`
          : `Last night scored ${report.score} points. Consider improving your sleep environment.`,
      });
    }

    // Deep sleep analysis
    const deepRatio = Math.round(report.deepMinutes / report.totalSleepMinutes * 100);
    if (deepRatio >= 20) {
      items.push({
        icon: "moon",
        title: zh ? "深睡充足" : "Adequate deep sleep",
        body: zh
          ? `深睡时长达 ${report.deepMinutes} 分钟（占比 ${deepRatio}%），有助于身体恢复。`
          : `Deep sleep reached ${report.deepMinutes} minutes (${deepRatio}%), supporting physical recovery.`,
      });
    } else {
      items.push({
        icon: "moon",
        title: zh ? "深睡不足" : "Insufficient deep sleep",
        body: zh
          ? `深睡仅 ${report.deepMinutes} 分钟，建议提前入睡或减少睡前屏幕使用。`
          : `Only ${report.deepMinutes} minutes of deep sleep. Try going to bed earlier.`,
      });
    }

    // Pregnancy-specific analysis
    if (week >= 24) {
      const sideLieMinutes = report.sideLieMinutes || report.deepMinutes + report.lightMinutes;
      if (sideLieMinutes > 300) {
        items.push({
          icon: "baby",
          title: zh ? "侧卧稳定性良好" : "Good side-sleep stability",
          body: zh
            ? `孕${week}周，侧卧时长达 ${Math.round(sideLieMinutes)} 分钟。建议继续保持左侧卧，有助于减轻下腔静脉压力。`
            : `At week ${week}, side-sleep duration was ${Math.round(sideLieMinutes)} minutes. Keep sleeping on your left side.`,
        });
      } else {
        items.push({
          icon: "baby",
          title: zh ? "关注侧卧舒适度" : "Watch side-sleep comfort",
          body: zh
            ? `孕${week}周建议使用孕妇枕支撑腰部和腿部，提升侧卧舒适度。`
            : `At week ${week}, consider using a pregnancy pillow for better side-sleep support.`,
        });
      }
    }

    // Turn analysis
    if (report.turns > 15) {
      items.push({
        icon: "baby",
        title: zh ? "翻身次数较多" : "Frequent turns",
        body: zh
          ? `夜间翻身 ${report.turns} 次，可能与腰背不适有关。床垫的辅助翻身功能可以提供帮助。`
          : `${report.turns} turns last night. The mattress assist feature can help reduce discomfort.`,
      });
    }

    // Week-specific tip
    if (tips.length > 0) {
      const tip = tips[0];
      items.push({
        icon: "baby",
        title: zh ? tip.titleZh : tip.titleEn,
        body: zh ? tip.bodyZh : tip.bodyEn,
      });
    }

    return items;
  })();

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

      {/* Sleep Analysis Report */}
      <section className="lorest-card mt-4 p-[18px]" data-el="report-summary">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-[#E0917F]" aria-hidden />
          <h2 className="font-heading text-[17px]">{t("report.sleepAnalysisTitle")}</h2>
        </div>
        <div className="mt-4 space-y-4">
          {sleepAnalysis.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 shrink-0">
                {item.icon === "trending" && <TrendingUp className="h-4 w-4 text-[#8FB287]" />}
                {item.icon === "moon" && <Moon className="h-4 w-4 text-[#7F9AA6]" />}
                {item.icon === "baby" && <Baby className="h-4 w-4 text-[#C0972F]" />}
              </span>
              <div>
                <div className="text-[14px] font-medium text-[#5F554F]">{item.title}</div>
                <p className="mt-1 text-[13px] leading-[1.6] text-[#776C66]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
