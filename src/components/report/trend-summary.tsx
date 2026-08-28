"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrendBars } from "@/components/report/trend-bars";
import { formatHm } from "@/lib/lorest/sleep";
import type { DayCell } from "@/lib/lorest/history";

type Metric = "score" | "sleep" | "deep";

/** Week/Month trend: metric toggle, tappable bars, averages. Selecting a bar
 * jumps back to the day view for that date (via onPickDay). */
export function TrendSummary({
  cells,
  selectedDate,
  onPickDay,
}: {
  cells: DayCell[];
  selectedDate: string;
  onPickDay: (date: string) => void;
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
    </>
  );
}
