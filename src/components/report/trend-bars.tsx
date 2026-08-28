"use client";

import type { DayCell } from "@/lib/lorest/history";
import { scoreDotColor } from "@/lib/lorest/history";

type Metric = "score" | "sleep" | "deep";

/** Tappable bar chart for week/month sleep trend. */
export function TrendBars({
  cells,
  metric,
  selectedDate,
  onSelect,
  compact,
}: {
  cells: DayCell[];
  metric: Metric;
  selectedDate: string;
  onSelect: (date: string) => void;
  compact?: boolean;
}) {
  const valueOf = (c: DayCell): number => {
    if (!c.day) return 0;
    return metric === "score" ? c.day.score : metric === "sleep" ? c.day.totalSleepMinutes : c.day.deepMinutes;
  };
  const max = Math.max(1, ...cells.map(valueOf));

  return (
    <div className="flex items-end gap-[3px]" style={{ height: 128 }} data-el="report-trend-bars">
      {cells.map((c) => {
        const v = valueOf(c);
        const h = c.day ? Math.max(6, (v / max) * 108) : 4;
        const isSel = c.date === selectedDate;
        const color = c.day ? scoreDotColor(c.day.score) : "rgba(180,168,158,.25)";
        return (
          <button
            key={c.date}
            type="button"
            onClick={() => c.day && onSelect(c.date)}
            disabled={!c.day}
            data-el="report-trend-bar"
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            style={{ height: "100%" }}
            aria-label={c.day ? `${c.label}: ${v}` : c.label}
            aria-pressed={isSel}
          >
            <span
              className="w-full rounded-full transition-all"
              style={{
                height: h,
                background: color,
                opacity: c.day ? (isSel ? 1 : 0.72) : 1,
                outline: isSel ? "2px solid rgba(142,106,94,.5)" : "none",
                outlineOffset: 1,
              }}
            />
            {!compact && (
              <span className="text-[9px] text-muted-foreground">{c.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
