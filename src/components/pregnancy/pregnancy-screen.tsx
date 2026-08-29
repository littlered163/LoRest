"use client";

import { useEffect, useState, useRef } from "react";
import { CalendarCheck, Check, Circle, Baby, Scale, Plus, ChevronLeft, ChevronRight, TrendingUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { TOTAL_WEEKS, weekInfo, weekTips } from "@/lib/lorest/sleep";
import {
  addTodoApi,
  addCheckupApi,
  addWeightLogApi,
  fetchCheckups,
  fetchProfile,
  fetchTodos,
  fetchWeightLogs,
  saveProfile,
  toggleTodoApi,
  type CheckupDto,
  type PregnancyTodoDto,
  type WeightLogDto,
} from "@/lib/api";

const DEMO_TODOS: PregnancyTodoDto[] = [
  { id: "demo-1", label: "预约第 25 周产检", done: false, orderIndex: 0 },
  { id: "demo-2", label: "补充钙与维生素 D", done: true, orderIndex: 1 },
  { id: "demo-3", label: "调整床垫支撑感受", done: false, orderIndex: 2 },
  { id: "demo-4", label: "每天散步 20-30 分钟", done: false, orderIndex: 3 },
  { id: "demo-5", label: "关注胎动规律", done: false, orderIndex: 4 },
];

// Demo weight logs (simulating mattress sync data)
const DEMO_WEIGHT_LOGS: WeightLogDto[] = [
  { id: "w1", weightKg: "56.0", recordedAt: "2026-07-01T00:00:00Z" },
  { id: "w2", weightKg: "56.8", recordedAt: "2026-07-08T00:00:00Z" },
  { id: "w3", weightKg: "57.5", recordedAt: "2026-07-15T00:00:00Z" },
  { id: "w4", weightKg: "58.2", recordedAt: "2026-07-22T00:00:00Z" },
  { id: "w5", weightKg: "58.8", recordedAt: "2026-07-29T00:00:00Z" },
  { id: "w6", weightKg: "59.5", recordedAt: "2026-08-05T00:00:00Z" },
  { id: "w7", weightKg: "60.2", recordedAt: "2026-08-12T00:00:00Z" },
  { id: "w8", weightKg: "61.0", recordedAt: "2026-08-19T00:00:00Z" },
  { id: "w9", weightKg: "61.5", recordedAt: "2026-08-26T00:00:00Z" },
];

const DEMO_CHECKUPS: CheckupDto[] = [
  { id: "demo-c1", label: "第 12 周建档", dateLabel: "6月15日", done: true, orderIndex: 0 },
  { id: "demo-c2", label: "第 16 周唐筛", dateLabel: "7月13日", done: true, orderIndex: 1 },
  { id: "demo-c3", label: "第 20 周大排畸", dateLabel: "8月10日", done: true, orderIndex: 2 },
  { id: "demo-c4", label: "第 25 周常规产检", dateLabel: "9月4日", done: false, orderIndex: 3 },
  { id: "demo-c5", label: "第 28 周糖耐", dateLabel: "9月25日", done: false, orderIndex: 4 },
];

// Simple line chart for weight trend
function WeightChart({ logs }: { logs: WeightLogDto[] }) {
  if (logs.length < 2) return null;
  // Sort by date ascending (oldest first)
  const sorted = [...logs].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const weights = sorted.map(l => parseFloat(l.weightKg));
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const range = maxW - minW || 1;
  const w = 280;
  const h = 80;
  const pts = weights.map((v, i) => ({
    x: (i / (weights.length - 1)) * w,
    y: h - ((v - minW) / range) * (h - 10) - 5,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#8FB287" strokeWidth={2.5} strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#8FB287" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{sorted[0]?.weightKg}kg</span>
        <span>{sorted[sorted.length - 1]?.weightKg}kg</span>
      </div>
    </div>
  );
}

// Add menu dialog
function AddMenu({
  open,
  onClose,
  onAddCheckup,
  onAddTodo,
  onAddWeight,
}: {
  open: boolean;
  onClose: () => void;
  onAddCheckup: () => void;
  onAddTodo: () => void;
  onAddWeight: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white p-4 pb-6 shadow-lg">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => { onAddCheckup(); onClose(); }}
            className="flex items-center gap-3 rounded-2xl bg-[#F5F2EE] px-4 py-3 text-left"
          >
            <CalendarCheck className="h-5 w-5 text-[#6E8390]" />
            <span className="text-[15px] text-[#5F554F]">{t("pregnancy.addCheckup")}</span>
          </button>
          <button
            type="button"
            onClick={() => { onAddTodo(); onClose(); }}
            className="flex items-center gap-3 rounded-2xl bg-[#F5F2EE] px-4 py-3 text-left"
          >
            <Check className="h-5 w-5 text-[#8FB287]" />
            <span className="text-[15px] text-[#5F554F]">{t("pregnancy.addTodo")}</span>
          </button>
          <button
            type="button"
            onClick={() => { onAddWeight(); onClose(); }}
            className="flex items-center gap-3 rounded-2xl bg-[#F5F2EE] px-4 py-3 text-left"
          >
            <Scale className="h-5 w-5 text-[#C0972F]" />
            <span className="text-[15px] text-[#5F554F]">{t("pregnancy.addWeight")}</span>
          </button>
        </div>
      </div>
    </>
  );
}

// Calendar view
function CalendarView({
  checkups,
  selectedDate,
  onSelectDate,
}: {
  checkups: CheckupDto[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const { i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const [viewMonth, setViewMonth] = useState(new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  function hasCheckup(day: number) {
    return checkups.some(c => {
      const d = c.dateLabel.match(/(\d+)月(\d+)日/);
      return d && parseInt(d[1]) === month + 1 && parseInt(d[2]) === day;
    });
  }

  const isSelected = (day: number) =>
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month &&
    selectedDate.getDate() === day;

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div className="lorest-card mt-4 p-4">
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setViewMonth(new Date(year, month - 1))} className="p-1">
          <ChevronLeft className="h-5 w-5 text-[#7D726D]" />
        </button>
        <span className="font-heading text-[15px]">
          {zh ? `${year}年${month + 1}月` : `${year}-${month + 1}`}
        </span>
        <button type="button" onClick={() => setViewMonth(new Date(year, month + 1))} className="p-1">
          <ChevronRight className="h-5 w-5 text-[#7D726D]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["日", "一", "二", "三", "四", "五", "六"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <button
            key={i}
            type="button"
            disabled={!day}
            onClick={() => day && onSelectDate(new Date(year, month, day))}
            className={`relative flex aspect-square items-center justify-center rounded-lg text-[13px] transition-colors ${
              !day ? "invisible" : ""
            } ${
              isSelected(day!) ? "bg-[#8FB287] text-white" :
              isToday(day!) ? "bg-[#F5F2EE] text-[#5F554F]" :
              "text-[#5F554F] hover:bg-[#F5F2EE]"
            }`}
          >
            {day}
            {day && hasCheckup(day) && (
              <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#C0972F]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PregnancyScreen() {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");
  const { user } = useAuth();

  const [week, setWeek] = useState(24);
  const [todos, setTodos] = useState<PregnancyTodoDto[]>([]);
  const [checkups, setCheckups] = useState<CheckupDto[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogDto[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [newCheckup, setNewCheckup] = useState("");
  const [newCheckupDate, setNewCheckupDate] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showForm, setShowForm] = useState<"checkup" | "todo" | "weight" | null>(null);
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loaded, setLoaded] = useState(false);
  const weekDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        let p: { week: number; dueDate?: string } = { week: 24, dueDate: "" };
        let td: typeof DEMO_TODOS = [];
        let ck: typeof DEMO_CHECKUPS = [];
        let wl: typeof weightLogs = [];

        if (user) {
          [p, td, ck, wl] = await Promise.all([
            fetchProfile().catch(() => p),
            fetchTodos().catch(() => []),
            fetchCheckups().catch(() => []),
            fetchWeightLogs().catch(() => []),
          ]);
        }

        if (!active) return;
        // Use demo data if no user data
        setWeek(p.week);
        setTodos(td.length > 0 ? td : DEMO_TODOS);
        setCheckups(ck.length > 0 ? ck : DEMO_CHECKUPS);
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

  // Click outside to close week dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(event.target as Node)) {
        setShowWeekDropdown(false);
      }
    }
    if (showWeekDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showWeekDropdown]);

  const loading = Boolean(user) && !loaded;
  void loading; // kept for future loading state

  const info = weekInfo(week);
  const tips = weekTips(week);
  const progress = Math.round((week / TOTAL_WEEKS) * 100);
  const weekWindow = [week - 1, week, week + 1, week + 2].filter((w) => w >= 4 && w <= TOTAL_WEEKS);
  void weekWindow; // kept for future week navigation

  const latestWeight = weightLogs[0]?.weightKg;

  async function chooseWeek(w: number) {
    setWeek(w);
    if (user) await saveProfile({ week: w }).catch(() => undefined);
  }

  async function onToggleTodo(id: string) {
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    if (user) await toggleTodoApi(id).catch(() => undefined);
  }

  async function onAddTodo() {
    const label = newTodo.trim();
    if (!label || !user) return;
    setNewTodo("");
    const optimistic: PregnancyTodoDto = { id: `local-${Date.now()}`, label, done: false, orderIndex: todos.length };
    setTodos((prev) => [...prev, optimistic]);
    try {
      const saved = await addTodoApi(label);
      setTodos((prev) => prev.map((item) => (item.id === optimistic.id ? saved : item)));
    } catch {
      setTodos((prev) => prev.filter((item) => item.id !== optimistic.id));
      setNewTodo(label);
    }
  }

  async function onAddCheckup() {
    const label = newCheckup.trim();
    if (!label || !user) return;
    setNewCheckup("");
    setNewCheckupDate("");
    const optimistic: CheckupDto = { id: `local-${Date.now()}`, label, dateLabel: newCheckupDate.trim(), done: false, orderIndex: checkups.length };
    setCheckups((prev) => [...prev, optimistic]);
    try {
      const saved = await addCheckupApi(label, newCheckupDate.trim());
      setCheckups((prev) => prev.map((item) => (item.id === optimistic.id ? saved : item)));
    } catch {
      setCheckups((prev) => prev.filter((item) => item.id !== optimistic.id));
      setNewCheckup(label);
      setNewCheckupDate(newCheckupDate);
    }
  }

  async function onAddWeight() {
    const weight = newWeight.trim();
    if (!weight || !user) return;
    setNewWeight("");
    const log = await addWeightLogApi(weight).catch(() => null);
    if (log) setWeightLogs((prev) => [log, ...prev]);
    setShowForm(null);
  }

  return (
    <ScreenShell label="孕期旅程">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-[13px] tracking-wide text-muted-foreground">
            {t("pregnancy.dueCountdown", { days: info.daysToDue })}
          </div>
          <h1 className="font-heading mt-1.5 text-[28px] font-semibold leading-tight">
            {t("pregnancy.title")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
            className="grid h-10 w-10 place-items-center rounded-full border border-border"
            style={{ background: "rgba(255,255,255,.4)" }}
          >
            <CalendarCheck className="h-5 w-5 text-[#7D726D]" />
          </button>
          <LorestLangToggle />
        </div>
      </header>

      {/* + FAB */}
      {user && (
        <button
          type="button"
          onClick={() => setShowAddMenu(true)}
          className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full shadow-lg"
          style={{ background: "linear-gradient(135deg,#AEC2CE,#9CB79A)" }}
        >
          <Plus className="h-7 w-7 text-white" />
        </button>
      )}

      <AddMenu
        open={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onAddCheckup={() => { setShowForm("checkup"); setNewCheckup(""); setNewCheckupDate(""); }}
        onAddTodo={() => { setShowForm("todo"); setNewTodo(""); }}
        onAddWeight={() => { setShowForm("weight"); setNewWeight(""); }}
      />

      <section className="lorest-card lorest-card-strong p-[18px]" data-el="pregnancy-baby">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full px-3 py-1.5 text-xs text-[#8E6A5E]" style={{ background: "rgba(156,183,154,.34)" }}>
            {t("pregnancy.weekBadge", { week })}
          </span>
          <span className="text-[13px] text-muted-foreground">{progress}%</span>
        </div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Scale className="h-4 w-4" aria-hidden /> {t("pregnancy.recordWeight")}
              </div>
              <div className="flex items-center gap-1 text-[13px] text-[#5F554F]">
                <TrendingUp className="h-3 w-3 text-[#8FB287]" />
                <span>{latestWeight} kg</span>
              </div>
            </div>
            {weightLogs.length > 1 && <WeightChart logs={weightLogs} />}
            {user && (
              <div className="mt-2 flex gap-2">
                {showForm === "weight" ? (
                  <>
                    <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="kg" className="flex-1 rounded-xl border border-border bg-white/60 px-3 py-1.5 text-[14px]" />
                    <button type="button" onClick={() => void onAddWeight()} disabled={!newWeight.trim()} className="shrink-0 rounded-xl bg-[#8FB287] px-3 py-1.5 text-[14px] font-semibold text-white">{t("common.save")}</button>
                    <button type="button" onClick={() => { setShowForm(null); setNewWeight(""); }} className="shrink-0 rounded-xl bg-gray-100 px-3 py-1.5 text-[14px] text-[#7D726D]">{t("common.cancel")}</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setShowForm("weight")} className="text-[13px] text-[#8FB287] hover:underline">+ 添加记录</button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mt-4">
        <div className="mb-2 text-[13px] text-muted-foreground">{t("pregnancy.weekSelector")}</div>
        <div className="relative" ref={weekDropdownRef} data-el="pregnancy-week-selector">
          <button
            type="button"
            onClick={() => setShowWeekDropdown(!showWeekDropdown)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-white/60 px-4 py-3 text-left"
          >
            <span className="text-[15px] text-[#5F554F]">{t("pregnancy.weekBadge", { week })}</span>
            <ChevronDown className={`h-5 w-5 text-[#7D726D] transition-transform ${showWeekDropdown ? "rotate-180" : ""}`} />
          </button>
          {showWeekDropdown && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
              <div className="grid grid-cols-4 gap-1 p-2">
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => { void chooseWeek(w); setShowWeekDropdown(false); }}
                    className={`rounded-xl px-2 py-2 text-sm transition-colors ${
                      w === week
                        ? "bg-[#8FB287] text-white"
                        : "text-[#5F554F] hover:bg-[#F5F2EE]"
                    }`}
                  >
                    {w}周
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <>
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

          <section className="lorest-card mt-4 p-[18px]" data-el="pregnancy-checkup">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-[#6E8390]" aria-hidden />
              <h2 className="font-heading text-[17px]">{t("pregnancy.checkupTitle")}</h2>
            </div>
            {user && showForm === "checkup" && (
              <div className="mt-3 flex gap-2">
                <input type="text" value={newCheckup} onChange={(e) => setNewCheckup(e.target.value)} placeholder={zh ? "添加产检" : "Add"} className="flex-1 rounded-2xl border border-border bg-white/60 px-3 py-2 text-[14px]" />
                <input type="text" value={newCheckupDate} onChange={(e) => setNewCheckupDate(e.target.value)} placeholder={zh ? "日期" : "Date"} className="w-20 rounded-2xl border border-border bg-white/60 px-2 py-2 text-[14px]" />
                <button type="button" onClick={() => void onAddCheckup()} disabled={!newCheckup.trim()} className="shrink-0 rounded-2xl bg-[#8FB287] px-3 py-2 text-[14px] font-semibold text-white">{t("common.save")}</button>
                <button type="button" onClick={() => setShowForm(null)} className="shrink-0 rounded-2xl bg-gray-100 px-3 py-2 text-[14px] text-[#7D726D]">{t("common.cancel")}</button>
              </div>
            )}
            <div className="mt-3 grid gap-2">
              {checkups.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-[14px]">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: c.done ? "rgba(127,154,166,.22)" : "rgba(156,183,154,.34)" }}>
                      {c.done ? <Check className="h-4 w-4 text-[#6E8390]" /> : <Circle className="h-3.5 w-3.5 text-[#B89A90]" />}
                    </span>
                    <span className={c.done ? "text-muted-foreground line-through" : "text-[#5F554F]"}>{c.label}</span>
                  </div>
                  <span className="text-[13px] text-muted-foreground">{c.dateLabel}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="lorest-card mt-4 p-[18px]" data-el="pregnancy-todos">
            <h2 className="font-heading text-[17px]">{t("pregnancy.todoTitle")}</h2>
            {user && showForm === "todo" && (
              <div className="mt-3 flex gap-2">
                <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void onAddTodo(); }} placeholder={zh ? "添加待办" : "Add to-do"} className="flex-1 rounded-2xl border border-border bg-white/60 px-3 py-2 text-[14px]" />
                <button type="button" onClick={() => void onAddTodo()} disabled={!newTodo.trim()} className="shrink-0 rounded-2xl bg-[#8FB287] px-3 py-2 text-[14px] font-semibold text-white">{t("common.save")}</button>
                <button type="button" onClick={() => setShowForm(null)} className="shrink-0 rounded-2xl bg-gray-100 px-3 py-2 text-[14px] text-[#7D726D]">{t("common.cancel")}</button>
              </div>
            )}
            <div className="mt-3 grid gap-2">
              {todos.map((td) => (
                <button key={td.id} type="button" onClick={() => void onToggleTodo(td.id)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px]" style={{ background: "rgba(255,252,247,.5)" }}>
                  <span className="grid h-6 w-6 place-items-center rounded-full border" style={{ borderColor: td.done ? "transparent" : "var(--border)", background: td.done ? "rgba(156,183,154,.6)" : "transparent" }}>
                    {td.done && <Check className="h-3.5 w-3.5 text-[#8E6A5E]" />}
                  </span>
                  <span className={td.done ? "text-muted-foreground line-through" : "text-[#5F554F]"}>{td.label}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <CalendarView
          checkups={checkups}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      <div className="h-24" />
    </ScreenShell>
  );
}
