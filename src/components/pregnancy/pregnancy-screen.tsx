"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Check, Circle, Baby, Scale, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { TOTAL_WEEKS, MAX_WEEK, weekInfo, weekTips, weekOfDate, daysToDueForDate } from "@/lib/lorest/sleep";
import { buildCheckupSchedule, type ScheduledCheckup } from "@/lib/lorest/prenatal";
import { addWeightLogApi, fetchProfile, fetchWeightLogs, type WeightLogDto } from "@/lib/api";

function formatDateLabel(iso: string, zh: boolean): string {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return zh ? `${m}月${day}日` : `${m}/${day}`;
}

function formatDate(d: Date, zh: boolean): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return zh ? `${m}月${day}日` : `${m}/${day}`;
}

function todayDateStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Demo weight logs (simulating mattress sync data)
const DEMO_WEIGHT_LOGS: WeightLogDto[] = [
  { id: "w1", weightKg: "60.1", recordedAt: "2026-08-16T00:00:00Z" },
  { id: "w2", weightKg: "60.5", recordedAt: "2026-08-19T00:00:00Z" },
  { id: "w3", weightKg: "60.8", recordedAt: "2026-08-22T00:00:00Z" },
  { id: "w4", weightKg: "61.2", recordedAt: "2026-08-25T00:00:00Z" },
  { id: "w5", weightKg: "61.5", recordedAt: "2026-08-27T00:00:00Z" },
  { id: "w6", weightKg: "61.7", recordedAt: "2026-08-29T00:00:00Z" },
];

// Weight card shows the last 7 days by default.
const WEIGHT_WINDOW_DAYS = 7;

// Line chart for weight trend. Points sit on real dates, the X-axis shows dates,
// and hovering / tapping a point reveals its date + weight in a tooltip.
function WeightChart({
  logs,
  selectedId,
  onSelect,
  zh,
}: {
  logs: WeightLogDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  zh: boolean;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  if (logs.length < 2) return null;
  // Sort by date ascending (oldest first)
  const sorted = [...logs].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const times = sorted.map((l) => new Date(l.recordedAt).getTime());
  const minT = times[0];
  const maxT = times[times.length - 1];
  const span = maxT - minT || 1;
  const weights = sorted.map((l) => parseFloat(l.weightKg));
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const range = maxW - minW || 1;
  const w = 280;
  const h = 80;
  // Position points by real date, not evenly by index
  const pts = sorted.map((l, i) => {
    const d = new Date(l.recordedAt);
    return {
      id: l.id,
      x: ((times[i] - minT) / span) * (w - 12) + 6,
      y: h - ((weights[i] - minW) / range) * (h - 10) - 5,
      axis: `${d.getMonth() + 1}/${d.getDate()}`,
    };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const activeId = hoverId ?? selectedId;
  const activePt = activeId ? pts.find((p) => p.id === activeId) ?? null : null;
  const activeLog = activeId ? sorted.find((l) => l.id === activeId) ?? null : null;

  return (
    <div className="mt-3">
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none">
          <path d={path} fill="none" stroke="#8FB287" strokeWidth={2.5} strokeLinecap="round" />
          {pts.map((p) => {
            const selected = p.id === selectedId;
            return (
              <g key={p.id}>
                {/* Invisible larger hit area for easy tapping / hovering */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => onSelect(p.id)}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={selected ? 5 : 3}
                  fill={selected ? "#C0972F" : "#8FB287"}
                  className="cursor-pointer transition-all"
                  onClick={() => onSelect(p.id)}
                />
              </g>
            );
          })}
        </svg>
        {activePt && activeLog && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-center"
            style={{
              left: `${(activePt.x / w) * 100}%`,
              top: `${Math.max(2, activePt.y - 34)}px`,
              background: "rgba(95,85,79,.92)",
            }}
          >
            <div className="text-[9px] leading-tight text-white/75">{formatDateLabel(activeLog.recordedAt, zh)}</div>
            <div className="text-[12px] font-semibold leading-tight text-white">{activeLog.weightKg} kg</div>
          </div>
        )}
      </div>
      {/* X-axis dates */}
      <div className="relative mt-1 h-3">
        {pts.map((p) => (
          <span key={p.id} className="absolute -translate-x-1/2 text-[9px] text-muted-foreground" style={{ left: `${(p.x / w) * 100}%` }}>
            {p.axis}
          </span>
        ))}
      </div>
    </div>
  );
}

// Calendar view — tapping a date selects it and switches the week to that day's week
function CalendarView({
  week,
  checkupDates,
  selectedDate,
  onSelectDate,
}: {
  week: number;
  checkupDates: Date[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const [viewMonth, setViewMonth] = useState(new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const dayHeaders = zh ? ["日", "一", "二", "三", "四", "五", "六"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function hasCheckup(day: number) {
    return checkupDates.some(
      (d) => d.getFullYear() === year && d.getMonth() === month && d.getDate() === day,
    );
  }

  const isSelected = (day: number) =>
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month &&
    selectedDate.getDate() === day;

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const selectedWeek = weekOfDate(week, selectedDate);
  const selectedDays = daysToDueForDate(week, selectedDate);
  const selectedLabel = zh
    ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`
    : `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`;

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setViewMonth(new Date(year, month - 1))} className="p-1">
          <ChevronLeft className="h-5 w-5 text-[#7D726D]" />
        </button>
        <span className="font-heading text-[15px]">{zh ? `${year}年${month + 1}月` : `${year}-${month + 1}`}</span>
        <button type="button" onClick={() => setViewMonth(new Date(year, month + 1))} className="p-1">
          <ChevronRight className="h-5 w-5 text-[#7D726D]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {dayHeaders.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Calendar grid with week labels */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(year, month, day);
          const wLabel = weekOfDate(week, date);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg transition-colors ${
                isSelected(day) ? "bg-[#8FB287] text-white" :
                isToday(day) ? "bg-[#F5F2EE] text-[#5F554F]" :
                "text-[#5F554F] hover:bg-[#F5F2EE]"
              }`}
            >
              <span className="text-[13px] leading-none">{day}</span>
              <span className={`mt-0.5 text-[8px] leading-none ${isSelected(day) ? "text-white/80" : "text-[#9C9B97]"}`}>
                W{wLabel}
              </span>
              {hasCheckup(day) && (
                <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isSelected(day) ? "bg-white/80" : "bg-[#C0972F]"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date detail */}
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2 text-[13px]" style={{ background: "rgba(255,252,247,.5)" }}>
        <span className="text-[#5F554F]">{selectedLabel}</span>
        <span className="font-heading text-[#8E6A5E]">{t("pregnancy.weekBadge", { week: selectedWeek })}</span>
        <span className="text-muted-foreground">
          {selectedDays > 0 ? t("pregnancy.dueCountdown", { days: selectedDays }) : t("pregnancy.duePassed")}
        </span>
      </div>
    </div>
  );
}

// Check-up card — every item in the standard schedule, derived from LMP.
function CheckupCard({ schedule }: { schedule: ScheduledCheckup[] }) {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="lorest-card mt-4 p-[18px]" data-el="pregnancy-checkup">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-[#6E8390]" aria-hidden />
        <h2 className="font-heading flex-1 text-[17px]">{t("pregnancy.checkupTitle")}</h2>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t("pregnancy.expand") : t("pregnancy.collapse")}
          className="grid h-8 w-8 place-items-center rounded-full bg-[#F5F2EE] text-[#7D726D]"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </div>
      {!collapsed && (
        <>
          {schedule.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">{t("pregnancy.checkupEmpty")}</p>
          ) : (
            <div className="mt-3 grid gap-1.5">
              {schedule.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-[14px] ${c.next ? "ring-1 ring-[#8FB287]" : ""}`}
                  style={{ background: c.done ? "rgba(255,252,247,.5)" : "rgba(156,183,154,.16)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: c.done ? "rgba(127,154,166,.22)" : "rgba(156,183,154,.34)" }}>
                      {c.done ? <Check className="h-4 w-4 text-[#6E8390]" /> : <Circle className="h-3.5 w-3.5 text-[#B89A90]" />}
                    </span>
                    <div>
                      <div className={c.done ? "text-[13px] text-muted-foreground" : "text-[13px] text-[#5F554F]"}>
                        {zh ? c.labelZh : c.labelEn}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{t("pregnancy.weekBadge", { week: c.week })}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted-foreground">{formatDate(c.date, zh)}</span>
                    {c.next && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ background: "#8FB287" }}>
                        {t("pregnancy.checkupNext")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function PregnancyScreen() {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const { user } = useAuth();

  const [week, setWeek] = useState(24);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string | null>(null);
  const [initialWeightKg, setInitialWeightKg] = useState<string | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLogDto[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [newWeightDate, setNewWeightDate] = useState(todayDateStr());
  const [selectedWeightId, setSelectedWeightId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<"weight" | null>(null);
  const [weekCalendarOpen, setWeekCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        let p: { week: number; pregnancyStartDate: string | null; initialWeightKg: string | null } = {
          week: 24,
          pregnancyStartDate: null,
          initialWeightKg: null,
        };
        let wl: typeof weightLogs = [];

        if (!user) {
          // Signed-out preview: local demo data, no backend involved.
          setWeightLogs(DEMO_WEIGHT_LOGS);
          if (active) setLoaded(true);
          return;
        }

        if (user.id.startsWith("roadshow-demo-")) {
          // One-click demo: render instantly from local seed data so a first
          // visit from any device doesn't wait for the cross-region DB connect
          // (~5s). Real data replaces it seamlessly once it arrives.
          setWeek(28);
          setWeightLogs(DEMO_WEIGHT_LOGS);
          if (active) setLoaded(true);
          fetchProfile()
            .then((prof) => {
              if (!active) return;
              setWeek(prof.week);
              setPregnancyStartDate(prof.pregnancyStartDate);
              setInitialWeightKg(prof.initialWeightKg);
            })
            .catch(() => undefined);
          fetchWeightLogs()
            .then((logs) => {
              if (!active || logs.length === 0) return;
              setWeightLogs(logs);
              setSelectedWeightId(logs[0]?.id ?? null);
            })
            .catch(() => undefined);
          return;
        }

        // Real users: wait for server data.
        [p, wl] = await Promise.all([
          fetchProfile().catch(() => p),
          fetchWeightLogs().catch(() => []),
        ]);
        if (!active) return;
        setWeek(p.week);
        setPregnancyStartDate(p.pregnancyStartDate);
        setInitialWeightKg(p.initialWeightKg);
        setWeightLogs(wl.length > 0 ? wl : DEMO_WEIGHT_LOGS);
      } catch {
        // ignore
      } finally {
        if (active) setLoaded(true);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [user]);

  const loading = Boolean(user) && !loaded;
  void loading; // kept for future loading state

  const info = weekInfo(week);
  const tips = weekTips(week);
  const progress = Math.min(100, Math.round((week / TOTAL_WEEKS) * 100));
  const weekWindow = [week - 1, week, week + 1, week + 2].filter((w) => w >= 4 && w <= MAX_WEEK);
  void weekWindow; // kept for future week navigation

  const filteredWeightLogs = weightLogs.filter((l) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - WEIGHT_WINDOW_DAYS);
    return new Date(l.recordedAt) >= cutoff;
  });

  // Cumulative weight gain vs. pre-pregnancy weight (latest reading − initial weight).
  const latestWeightKg = weightLogs.length > 0 ? parseFloat(weightLogs[0].weightKg) : null;
  const weightGainKg =
    latestWeightKg !== null && initialWeightKg !== null
      ? latestWeightKg - parseFloat(initialWeightKg)
      : null;

  /** Tapping a calendar date selects it and switches the week to that day's week (browsing only). */
  function onSelectCalendarDate(date: Date) {
    setSelectedDate(date);
    setWeek(weekOfDate(week, date));
  }

  async function onAddWeight() {
    const weight = newWeight.trim();
    if (!weight || !user) return;
    const recordedAt = newWeightDate ? new Date(newWeightDate + "T00:00:00").toISOString() : undefined;
    setNewWeight("");
    setNewWeightDate(todayDateStr());
    const log = await addWeightLogApi(weight, recordedAt).catch(() => null);
    if (log) {
      setWeightLogs((prev) => [log, ...prev]);
      setSelectedWeightId(log.id);
    }
    setShowForm(null);
  }

  const schedule = buildCheckupSchedule(pregnancyStartDate);
  const checkupDates = schedule.map((c) => c.date);

  return (
    <ScreenShell label="孕期旅程">
      <header className="mb-5 flex items-center justify-between gap-4">
        <h1 className="font-heading text-[28px] font-semibold leading-tight">{t("pregnancy.title")}</h1>
        <div className="flex items-center gap-2">
          <LorestLangToggle />
        </div>
      </header>

      <section className="lorest-card lorest-card-strong p-[18px]" data-el="pregnancy-baby">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekCalendarOpen(!weekCalendarOpen)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#8E6A5E]"
              style={{ background: "rgba(156,183,154,.34)" }}
              data-el="pregnancy-week-selector"
            >
              {t("pregnancy.weekBadge", { week })}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${weekCalendarOpen ? "rotate-180" : ""}`} />
            </button>
            <span className="text-[13px] text-muted-foreground">
              {info.daysToDue > 0 ? t("pregnancy.dueCountdown", { days: info.daysToDue }) : t("pregnancy.duePassed")}
            </span>
          </div>
          <span className="text-[13px] text-muted-foreground">{progress}%</span>
        </div>
        {weekCalendarOpen && (
          <CalendarView
            week={week}
            checkupDates={checkupDates}
            selectedDate={selectedDate}
            onSelectDate={onSelectCalendarDate}
          />
        )}
        <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: "rgba(174,194,206,.3)" }}>
          <i className="block h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#AEC2CE,#9CB79A)" }} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full" style={{ background: "radial-gradient(circle,#fff,#E4CDA0 70%,#9CB79A)" }}>
            <Baby className="h-7 w-7 text-white/90" aria-hidden />
          </span>
          <div>
            <div className="text-[13px] text-muted-foreground">{t("pregnancy.sizeTitle")}</div>
            <div className="font-heading text-[18px]">
              {t("pregnancy.sizeCompare", { fruit: zh ? info.fruitZh : info.fruitEn })}
            </div>
            <div className="text-[13px] text-muted-foreground">
              {t("pregnancy.sizeDetail", { length: info.babyLengthCm, weight: info.babyWeightG })}
            </div>
          </div>
        </div>
        {/* Weight trend chart - always show when has data */}
        {weightLogs.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Scale className="h-4 w-4" aria-hidden /> {t("pregnancy.recordWeight")}
              </div>
              {weightGainKg !== null && (
                <span className="text-[12px]" style={{ color: weightGainKg >= 0 ? "#C0972F" : "#7F9AA6" }}>
                  {t("pregnancy.weightGain", { gain: (weightGainKg >= 0 ? "+" : "") + weightGainKg.toFixed(1) })}
                </span>
              )}
            </div>
            {filteredWeightLogs.length > 1 && (
              <WeightChart logs={filteredWeightLogs} selectedId={selectedWeightId} onSelect={setSelectedWeightId} zh={zh} />
            )}
            {filteredWeightLogs.length === 0 && (
              <p className="mt-2 text-center text-[13px] text-muted-foreground">{t("pregnancy.weightEmpty")}</p>
            )}
            {user && (
              <div className="mt-2">
                {showForm === "weight" ? (
                  <div className="grid gap-2">
                    <div className="flex gap-2">
                      <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="kg" className="flex-1 rounded-xl border border-border bg-white/60 px-3 py-1.5 text-[14px]" />
                      <input type="date" value={newWeightDate} onChange={(e) => setNewWeightDate(e.target.value)} className="w-[132px] rounded-xl border border-border bg-white/60 px-2 py-1.5 text-[13px] text-[#5F554F]" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void onAddWeight()} disabled={!newWeight.trim()} className="flex-1 rounded-xl bg-[#8FB287] px-3 py-1.5 text-[14px] font-semibold text-white">{t("common.save")}</button>
                      <button type="button" onClick={() => { setShowForm(null); setNewWeight(""); }} className="rounded-xl bg-gray-100 px-4 py-1.5 text-[14px] text-[#7D726D]">{t("common.cancel")}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setShowForm("weight"); setNewWeightDate(todayDateStr()); }} className="text-[13px] text-[#8FB287] hover:underline">{t("pregnancy.addRecord")}</button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="lorest-card mt-4 p-[18px]" data-el="pregnancy-tips">
        <h2 className="font-heading text-[17px]">{t("pregnancy.tipsTitle")}</h2>
        <div className="mt-3 grid gap-3">
          {tips.map((tip) => (
            <div key={tip.id} className="rounded-2xl p-3.5" style={{ background: "rgba(255,252,247,.5)" }}>
              <div className="font-heading text-[15px]">{zh ? tip.titleZh : tip.titleEn}</div>
              <p className="mt-1 text-[13px] leading-[1.6] text-[#776C66]">{zh ? tip.bodyZh : tip.bodyEn}</p>
            </div>
          ))}
        </div>
      </section>

      <CheckupCard schedule={schedule} />

      <div className="h-24" />
    </ScreenShell>
  );
}
