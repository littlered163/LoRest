// Deterministic simulated sleep history and weather for the LoRest prototype.
// The mattress-collected nightly signals are device readings (not user input),
// so they are derived deterministically per date rather than stored per user.

import type { SleepSummary, StageKind, StageSegment } from "./sleep";

export interface DaySleep {
  /** ISO date key: YYYY-MM-DD */
  date: string;
  score: number;
  totalSleepMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  lightMinutes: number;
}

// Small deterministic pseudo-random generator seeded by date, so the same day
// always yields the same night — no flicker between renders.
function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Generate one night's derived record for a given date. */
export function daySleepFor(date: Date): DaySleep {
  const seed = date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  const r = seededRand(seed);
  const r2 = seededRand(seed + 7);
  // Score gently oscillates 68–94, weekends slightly better.
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const base = 72 + Math.round(r * 20) + (weekend ? 4 : 0);
  const score = Math.max(62, Math.min(96, base));
  const totalSleepMinutes = 360 + Math.round(r2 * 140); // 6:00–8:20
  const deepMinutes = Math.round(totalSleepMinutes * (0.2 + r * 0.08));
  const remMinutes = Math.round(totalSleepMinutes * (0.18 + r2 * 0.06));
  const lightMinutes = totalSleepMinutes - deepMinutes - remMinutes;
  return { date: dateKey(date), score, totalSleepMinutes, deepMinutes, remMinutes, lightMinutes };
}

/** Records for the last `days` days, most recent last. Reference "today" is Aug 28. */
export const REFERENCE_TODAY = new Date(2026, 7, 28); // months are 0-based → August

export function recentDays(days: number, end: Date = REFERENCE_TODAY): DaySleep[] {
  const out: DaySleep[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push(daySleepFor(d));
  }
  return out;
}

export interface DayCell {
  date: string;
  label: string; // short axis label
  day: DaySleep | null; // null = future / no data
}

/** The 7 days (Sun–Sat) of the week containing `anchor`. */
export function daysForWeekOf(anchor: Date): DayCell[] {
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay()); // back to Sunday
  const out: DayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const future = d > REFERENCE_TODAY;
    out.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label: String(d.getDate()),
      day: future ? null : daySleepFor(d),
    });
  }
  return out;
}

/** Every day of the month containing `anchor` (future days → null). */
export function daysForMonthOf(anchor: Date): DayCell[] {
  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const out: DayCell[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const future = d > REFERENCE_TODAY;
    out.push({
      date: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      label: String(day),
      day: future ? null : daySleepFor(d),
    });
  }
  return out;
}

/** All records for a given calendar month (only up to REFERENCE_TODAY). */
export function monthDays(year: number, monthIndex: number): (DaySleep | null)[] {
  const first = new Date(year, monthIndex, 1);
  const startWeekday = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (DaySleep | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null); // leading blanks
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    cells.push(d <= REFERENCE_TODAY ? daySleepFor(d) : null);
  }
  return cells;
}

// Warm low-saturation dot color by score band.
export function scoreDotColor(score: number): string {
  if (score >= 88) return "#7F9AA6"; // deep restful blue
  if (score >= 80) return "#AEC2CE"; // misty blue
  if (score >= 72) return "#E4CDA0"; // warm gold
  return "#E7C6C0"; // soft rose (gentler nights)
}

// Build a full per-day report (stages + curves) deterministically from a DaySleep,
// reusing the same visual shape as the main report.
export function reportForDay(day: DaySleep): SleepSummary & { stages: StageSegment[]; heart: number[]; breath: number[] } {
  const seed = parseDateKey(day.date).getTime() / 8.64e7;
  const stages = buildStages(day, seed);
  const avgHeartRate = 60 + Math.round(seededRand(seed + 3) * 12);
  const avgBreathRate = 13 + Math.round(seededRand(seed + 5) * 4);
  const md = parseDateKey(day.date);
  return {
    score: day.score,
    totalSleepMinutes: day.totalSleepMinutes,
    deepMinutes: day.deepMinutes,
    lightMinutes: day.lightMinutes,
    remMinutes: day.remMinutes,
    awakeMinutes: 8 + Math.round(seededRand(seed + 1) * 16),
    avgHeartRate,
    avgBreathRate,
    turns: 8 + Math.round(seededRand(seed + 2) * 10),
    leaveBedTimes: Math.round(seededRand(seed + 4) * 2),
    fallAsleepMinutes: 10 + Math.round(seededRand(seed + 6) * 18),
    roomTemp: 23 + Math.round(seededRand(seed + 8) * 2),
    humidity: 48 + Math.round(seededRand(seed + 9) * 10),
    quality: day.score >= 85 ? "良好" : day.score >= 75 ? "一般" : "有待提高",
    dateLabel: `${md.getMonth() + 1}月${md.getDate()}日`,
    stages,
    heart: buildCurve(seed, avgHeartRate, 8),
    breath: buildCurve(seed + 50, avgBreathRate, 2),
    // Extended metrics for pregnancy
    sideLieMinutes: 280 + Math.round(seededRand(seed + 10) * 60),
    wakeAfterSleepMinutes: 5 + Math.round(seededRand(seed + 11) * 20),
  };
}

// Extended day report with pregnancy-specific metrics
export interface DayReportExt extends ReturnType<typeof reportForDay> {
  sideLieMinutes: number;
  wakeAfterSleepMinutes: number;
}

// Week summary
export interface WeekSummary {
  avgScore: number;
  avgSleepMinutes: number;
  avgDeepMinutes: number;
  avgSideLieMinutes: number;
  avgTurns: number;
  trend: "up" | "down" | "stable";
  totalNights: number;
}

export function weekSummary(cells: DayCell[]): WeekSummary {
  const validDays = cells.filter((c): c is DayCell & { day: DaySleep } => c.day !== null);
  if (validDays.length === 0) {
    return { avgScore: 0, avgSleepMinutes: 0, avgDeepMinutes: 0, avgSideLieMinutes: 0, avgTurns: 0, trend: "stable", totalNights: 0 };
  }
  const reports = validDays.map(c => reportForDay(c.day));
  const avgScore = Math.round(reports.reduce((a, r) => a + r.score, 0) / reports.length);
  const avgSleepMinutes = Math.round(reports.reduce((a, r) => a + r.totalSleepMinutes, 0) / reports.length);
  const avgDeepMinutes = Math.round(reports.reduce((a, r) => a + r.deepMinutes, 0) / reports.length);
  const avgSideLieMinutes = Math.round(reports.reduce((a, r) => a + (r.sideLieMinutes ?? 0), 0) / reports.length);
  const avgTurns = Math.round(reports.reduce((a, r) => a + r.turns, 0) / reports.length);

  // Calculate trend (compare first half vs second half)
  const mid = Math.floor(reports.length / 2);
  const firstHalf = reports.slice(0, mid).reduce((a, r) => a + r.score, 0) / mid;
  const secondHalf = reports.slice(mid).reduce((a, r) => a + r.score, 0) / (reports.length - mid);
  const trendDiff = secondHalf - firstHalf;
  const trend = trendDiff > 3 ? "up" : trendDiff < -3 ? "down" : "stable";

  return { avgScore, avgSleepMinutes, avgDeepMinutes, avgSideLieMinutes, avgTurns, trend, totalNights: validDays.length };
}

// Month summary
export interface MonthSummary {
  avgScore: number;
  avgSleepMinutes: number;
  bestDay: { date: string; score: number };
  worstDay: { date: string; score: number };
  totalNights: number;
  sleepTrend: number[];
}

export function monthSummary(cells: DayCell[]): MonthSummary {
  const validDays = cells.filter((c): c is DayCell & { day: DaySleep } => c.day !== null);
  if (validDays.length === 0) {
    return { avgScore: 0, avgSleepMinutes: 0, bestDay: { date: "", score: 0 }, worstDay: { date: "", score: 0 }, totalNights: 0, sleepTrend: [] };
  }
  const reports = validDays.map(c => ({ date: c.date, ...reportForDay(c.day) }));
  const avgScore = Math.round(reports.reduce((a, r) => a + r.score, 0) / reports.length);
  const avgSleepMinutes = Math.round(reports.reduce((a, r) => a + r.totalSleepMinutes, 0) / reports.length);

  const sorted = [...reports].sort((a, b) => b.score - a.score);
  const bestDay = { date: sorted[0]?.date || "", score: sorted[0]?.score || 0 };
  const worstDay = { date: sorted[sorted.length - 1]?.date || "", score: sorted[sorted.length - 1]?.score || 0 };

  // Weekly trend (4 data points for month)
  const sleepTrend: number[] = [];
  const weekSize = Math.ceil(reports.length / 4);
  for (let i = 0; i < 4; i++) {
    const week = reports.slice(i * weekSize, (i + 1) * weekSize);
    if (week.length > 0) {
      sleepTrend.push(Math.round(week.reduce((a, r) => a + r.score, 0) / week.length));
    }
  }

  return { avgScore, avgSleepMinutes, bestDay, worstDay, totalNights: validDays.length, sleepTrend };
}

function buildStages(day: DaySleep, seed: number): StageSegment[] {
  // Distribute the night into a plausible cyclic hypnogram summing to total.
  const order: StageKind[] = ["awake", "light", "deep", "rem", "light", "deep", "rem", "light", "awake", "light", "rem", "deep", "light"];
  const weights = order.map((_, i) => 0.6 + seededRand(seed + i) * 0.8);
  const sum = weights.reduce((a, b) => a + b, 0);
  return order.map((kind, i) => ({
    kind,
    minutes: Math.max(4, Math.round((weights[i] / sum) * day.totalSleepMinutes)),
  }));
}

function buildCurve(seed: number, avg: number, spread: number): number[] {
  return Array.from({ length: 12 }, (_, i) => avg + Math.round((seededRand(seed + i) - 0.5) * spread * 2));
}

// ---- Simulated weather (deterministic by date) ----
export interface WeatherSim {
  tempC: number;
  humidity: number;
  conditionZh: string;
  conditionEn: string;
}

const CONDITIONS: Array<{ zh: string; en: string }> = [
  { zh: "晴", en: "Sunny" },
  { zh: "多云", en: "Cloudy" },
  { zh: "阴", en: "Overcast" },
  { zh: "小雨", en: "Light rain" },
];

export function weatherForDate(date: Date): WeatherSim {
  const seed = date.getFullYear() * 500 + (date.getMonth() + 1) * 32 + date.getDate();
  const r1 = seededRand(seed + 11);
  const r2 = seededRand(seed + 22);
  const r3 = seededRand(seed + 33);
  // Seasonal temp: peak ~32℃ in summer (month 7-8), ~8℃ in winter
  const month = date.getMonth() + 1;
  const seasonal = 20 - 12 * Math.cos(((month - 1) / 12) * 2 * Math.PI);
  const tempC = Math.round(seasonal + (r1 - 0.5) * 6);
  const humidity = 45 + Math.round(r2 * 40);
  const condition = CONDITIONS[Math.floor(r3 * CONDITIONS.length)];
  return { tempC, humidity, conditionZh: condition.zh, conditionEn: condition.en };
}
