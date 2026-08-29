"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, BedDouble } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { DayReport } from "@/components/report/day-report";
import { TrendSummary } from "@/components/report/trend-summary";
import {
  REFERENCE_TODAY,
  daySleepFor,
  daysForMonthOf,
  daysForWeekOf,
  parseDateKey,
  reportForDay,
} from "@/lib/lorest/history";
import { useAuth } from "@/lib/auth/local-auth";
import { useDevices } from "@/lib/lorest/use-devices";

type ViewMode = "day" | "week" | "month";

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ReportScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const { user } = useAuth();
  const { primary } = useDevices();
  const hasDevice = Boolean(user && primary);

  const [view, setView] = useState<ViewMode>("day");
  const [anchor, setAnchor] = useState<Date>(REFERENCE_TODAY);

  const isToday = keyOf(anchor) === keyOf(REFERENCE_TODAY);

  // Can we page forward? Not beyond the period containing REFERENCE_TODAY.
  function shift(dir: 1 | -1) {
    const next = new Date(anchor);
    if (view === "day") next.setDate(anchor.getDate() + dir);
    else if (view === "week") next.setDate(anchor.getDate() + dir * 7);
    else next.setMonth(anchor.getMonth() + dir);
    if (next > REFERENCE_TODAY && dir === 1) return; // no future
    setAnchor(next);
  }

  const canForward = (() => {
    const next = new Date(anchor);
    if (view === "day") next.setDate(anchor.getDate() + 1);
    else if (view === "week") next.setDate(anchor.getDate() + 7);
    else next.setMonth(anchor.getMonth() + 1);
    return next <= REFERENCE_TODAY;
  })();

  function formatDate(d: Date): string {
    return zh ? `${d.getMonth() + 1}月${d.getDate()}日` : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Header label per view.
  const rangeLabel = (() => {
    if (view === "day") return isToday ? `${t("report.today")} · ${formatDate(anchor)}` : formatDate(anchor);
    if (view === "week") {
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - anchor.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return t("report.rangeWeek", { start: formatDate(start), end: formatDate(end) });
    }
    return zh ? `${anchor.getFullYear()}年${anchor.getMonth() + 1}月` : anchor.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  })();

  function pickDay(dateKey: string) {
    setAnchor(parseDateKey(dateKey));
    setView("day");
  }

  const report = reportForDay(daySleepFor(anchor));

  return (
    <ScreenShell withNav={false} label="睡眠报告">
      <header className="mb-4 flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.push("/")}
          data-el="report-back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border"
          style={{ background: "rgba(255,255,255,.4)", backdropFilter: "blur(16px)" }}
          aria-label={t("report.back")}
        >
          <ArrowLeft className="h-5 w-5 text-[#7D726D]" />
        </button>
        <h1 className="flex-1 font-heading text-[24px] font-semibold leading-tight">{t("report.title2")}</h1>
      </header>

      {/* View segment */}
      <div
        className="mb-3 grid grid-cols-3 gap-1 rounded-full p-1"
        style={{ background: "rgba(174,194,206,.2)" }}
        data-el="report-view-switch"
      >
        {(["day", "week", "month"] as ViewMode[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            data-el={`report-view-${v}`}
            className="rounded-full py-2 text-[13px] font-medium transition-colors"
            style={view === v ? { background: "rgba(255,252,247,.92)", color: "#8E6A5E" } : { color: "#8B817A" }}
            aria-pressed={view === v}
          >
            {t(`report.view${v.charAt(0).toUpperCase()}${v.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* Date pager */}
      <div className="mb-4 flex items-center justify-between gap-3" data-el="report-date-pager">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border"
          style={{ background: "rgba(255,255,255,.4)" }}
          aria-label="prev"
        >
          <ChevronLeft className="h-4.5 w-4.5 text-[#7D726D]" />
        </button>
        <div className="font-heading text-[15px] text-[#5F554F]">{rangeLabel}</div>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={!canForward}
          className="grid h-9 w-9 place-items-center rounded-full border border-border disabled:opacity-35"
          style={{ background: "rgba(255,255,255,.4)" }}
          aria-label="next"
        >
          <ChevronRight className="h-4.5 w-4.5 text-[#7D726D]" />
        </button>
      </div>

      {hasDevice ? (
        view === "day" ? (
          <DayReport report={report} />
        ) : (
          <TrendSummary
            cells={view === "week" ? daysForWeekOf(anchor) : daysForMonthOf(anchor)}
            selectedDate={keyOf(anchor)}
            onPickDay={pickDay}
          />
        )
      ) : (
        <section className="lorest-card mt-6 flex flex-col items-center gap-4 p-10" data-el="report-no-device">
          <BedDouble className="h-10 w-10 text-[#C4B9B3]" aria-hidden />
          <p className="text-center text-[14px] leading-[1.65] text-muted-foreground">
            {!user ? t("today.noDataSignIn") : t("today.noDataDevice")}
          </p>
          {!user && (
            <a
              href="/login"
              className="rounded-full px-6 py-2.5 text-[14px] font-semibold text-white"
              style={{ background: "linear-gradient(90deg,#AEC2CE,#9CB79A)" }}
            >
              {t("common.signIn")}
            </a>
          )}
        </section>
      )}
    </ScreenShell>
  );
}
