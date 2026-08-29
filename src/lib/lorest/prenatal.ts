// Prenatal check-up schedule, derived from the pregnancy start date (LMP).
// Like sleep data this is deterministic presentation data — not user-owned rows,
// so it is generated on the fly rather than stored in the database.

import { startOfDay } from "./sleep";

export interface PrenatalItem {
  id: string;
  week: number;
  labelZh: string;
  labelEn: string;
}

/** Standard mainland-China prenatal schedule (approximate). Adjust freely. */
export const CHECKUP_SCHEDULE: PrenatalItem[] = [
  { id: "first", week: 6, labelZh: "首次产检 · B超确认", labelEn: "First visit · ultrasound" },
  { id: "nt", week: 12, labelZh: "建档 + NT 检查", labelEn: "Registration + NT scan" },
  { id: "screen", week: 16, labelZh: "唐氏筛查", labelEn: "Down syndrome screening" },
  { id: "anatomy", week: 20, labelZh: "系统超声（大排畸）", labelEn: "Anatomy scan" },
  { id: "ogtt", week: 24, labelZh: "糖耐量筛查 OGTT", labelEn: "Glucose tolerance (OGTT)" },
  { id: "rout28", week: 28, labelZh: "常规产检", labelEn: "Routine check-up" },
  { id: "rout32", week: 32, labelZh: "常规产检 + 胎心监护", labelEn: "Routine + fetal monitoring" },
  { id: "rout36", week: 36, labelZh: "常规产检 + 胎心监护", labelEn: "Routine + fetal monitoring" },
  { id: "term", week: 37, labelZh: "足月产检 · 每周一次", labelEn: "Full-term visit · weekly" },
];

export interface ScheduledCheckup {
  id: string;
  week: number;
  labelZh: string;
  labelEn: string;
  /** Concrete calendar date for this check-up (LMP + week×7 days). */
  date: Date;
  /** Date is already past. */
  done: boolean;
  /** First not-yet-passed check-up. */
  next: boolean;
}

/** Build the full schedule for a pregnancy. Returns [] when LMP is unknown. */
export function buildCheckupSchedule(lmp: string | null, now = new Date()): ScheduledCheckup[] {
  if (!lmp) return [];
  const anchor = new Date(lmp).getTime();
  const today = startOfDay(now);
  const items: ScheduledCheckup[] = CHECKUP_SCHEDULE.map((c) => ({
    ...c,
    date: new Date(anchor + c.week * 7 * 86400000),
    done: false,
    next: false,
  })).map((i) => ({ ...i, done: i.date < today }));
  const firstUpcoming = items.find((i) => !i.done);
  if (firstUpcoming) firstUpcoming.next = true;
  return items;
}
