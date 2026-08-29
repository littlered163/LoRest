"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendBars } from "@/components/report/trend-bars";
import { formatHm, weekTips } from "@/lib/lorest/sleep";
import { weekSummary, monthSummary, type DayCell, type MonthSummary, type WeekSummary } from "@/lib/lorest/history";
import { TrendingUp, Moon, Baby, Calendar } from "lucide-react";

type Metric = "score" | "sleep" | "deep";

/** Week/Month trend: metric toggle, tappable bars, averages. Selecting a bar
 * jumps back to the day view for that date (via onPickDay). */
export function TrendSummary({
  cells,
  selectedDate,
  onPickDay,
  isMonth = false,
}: {
  cells: DayCell[];
  selectedDate: string;
  onPickDay: (date: string) => void;
  isMonth?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const [metric, setMetric] = useState<Metric>("score");

  const withData = cells.filter((c) => c.day);
  const avgScore = withData.length
    ? Math.round(withData.reduce((s, c) => s + c.day!.score, 0) / withData.length)
    : 0;
  const avgSleep = withData.length
    ? Math.round(withData.reduce((s, c) => s + c.day!.totalSleepMinutes, 0) / withData.length)
    : 0;
  const avgDeep = withData.length
    ? Math.round(withData.reduce((s, c) => s + c.day!.deepMinutes, 0) / withData.length)
    : 0;

  const compact = cells.length > 14; // month → hide per-bar labels

  // Generate analysis
  const week = 28; // Default for demo
  const tips = weekTips(week);
  const summary = isMonth ? monthSummary(cells) : weekSummary(cells);

  const analysis = (() => {
    const items: { icon: string; title: string; body: string }[] = [];

    if (isMonth) {
      const month = summary as MonthSummary;
      // Monthly analysis
      items.push({
        icon: "calendar",
        title: zh ? "本月概况" : "This month overview",
        body: zh
          ? `本月共 ${month.totalNights} 晚，平均睡眠得分 ${month.avgScore} 分，平均睡眠时长 ${formatHm(month.avgSleepMinutes, zh)}。`
          : `This month had ${month.totalNights} nights with an average score of ${month.avgScore} and ${formatHm(month.avgSleepMinutes, zh)} sleep.`,
      });
      if (month.sleepTrend.length > 0) {
        const trend = month.sleepTrend;
        const improving = trend[trend.length - 1] > trend[0];
        items.push({
          icon: "trending",
          title: zh ? "睡眠趋势" : "Sleep trend",
          body: improving
            ? (zh ? "本月睡眠质量呈上升趋势，继续保持！" : "Sleep quality improved this month. Keep it up!")
            : (zh ? "本月睡眠质量有所波动，建议关注睡前习惯。" : "Sleep quality fluctuated this month. Consider improving bedtime habits."),
        });
      }
    } else {
      const week = summary as WeekSummary;
      // Weekly analysis
      items.push({
        icon: "calendar",
        title: zh ? "本周概况" : "This week overview",
        body: zh
          ? `本周共 ${week.totalNights} 晚，平均睡眠得分 ${week.avgScore} 分，平均睡眠时长 ${formatHm(week.avgSleepMinutes, zh)}。`
          : `This week had ${week.totalNights} nights with an average score of ${week.avgScore} and ${formatHm(week.avgSleepMinutes, zh)} sleep.`,
      });
      if (week.trend === "up") {
        items.push({
          icon: "trending",
          title: zh ? "睡眠趋势上升" : "Improving trend",
          body: zh ? "本周睡眠质量呈上升趋势，继续保持！" : "Sleep quality improved this week. Keep it up!",
        });
      } else if (week.trend === "down") {
        items.push({
          icon: "trending",
          title: zh ? "睡眠趋势下降" : "Declining trend",
          body: zh ? "本周睡眠质量有所下降，建议关注睡前环境和作息。" : "Sleep quality declined this week. Consider improving bedtime habits.",
        });
      }
      if (week.avgSideLieMinutes > 0) {
        items.push({
          icon: "moon",
          title: zh ? "侧卧分析" : "Side-sleep analysis",
          body: zh
            ? `孕中后期侧卧时长达 ${Math.round(week.avgSideLieMinutes)} 分钟/晚，建议保持左侧卧。`
            : `Side-sleep duration averaged ${Math.round(week.avgSideLieMinutes)} minutes/night. Keep sleeping on your left side.`,
        });
      }
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
      <section className="lorest-card lorest-card-strong p-[18px]" data-el="report-trend">
        <div className="flex flex-wrap gap-2">
          {(["score", "sleep", "deep"] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              data-el={`report-trend-metric-${m}`}
              className="rounded-full border px-3 py-1.5 text-xs transition-colors"
              style={
                metric === m
                  ? { background: "rgba(156,183,154,.4)", borderColor: "transparent", color: "#8E6A5E" }
                  : { background: "transparent", borderColor: "var(--border)", color: "#7D726D" }
              }
              aria-pressed={metric === m}
            >
              {t(`report.trend${m.charAt(0).toUpperCase()}${m.slice(1)}`)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <TrendBars
            cells={cells}
            metric={metric}
            selectedDate={selectedDate}
            onSelect={onPickDay}
            compact={compact}
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("report.tapBarHint")}</p>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2.5" data-el="report-trend-averages">
        {[
          { v: String(avgScore), s: t("report.avgScore") },
          { v: formatHm(avgSleep, zh), s: t("report.avgSleep") },
          { v: formatHm(avgDeep, zh), s: t("report.avgDeep") },
        ].map((m) => (
          <div key={m.s} className="lorest-card min-w-0 px-2 py-3.5 text-center">
            <b className="block text-[18px] leading-tight" style={{ letterSpacing: "-.03em" }}>{m.v}</b>
            <span className="mt-1 block whitespace-nowrap text-[11px] text-muted-foreground">{m.s}</span>
          </div>
        ))}
      </section>

      {/* Week/Month Analysis */}
      <section className="lorest-card mt-4 p-[18px]" data-el="report-trend-analysis">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#6E8390]" />
          <h2 className="font-heading text-[17px]">{t("report.sleepAnalysisTitle")}</h2>
        </div>
        <div className="mt-4 space-y-4">
          {analysis.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 shrink-0">
                {item.icon === "trending" && <TrendingUp className="h-4 w-4 text-[#8FB287]" />}
                {item.icon === "moon" && <Moon className="h-4 w-4 text-[#7F9AA6]" />}
                {item.icon === "baby" && <Baby className="h-4 w-4 text-[#C0972F]" />}
                {item.icon === "calendar" && <Calendar className="h-4 w-4 text-[#6E8390]" />}
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
