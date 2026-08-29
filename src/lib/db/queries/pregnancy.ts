import { and, asc, eq, desc } from "drizzle-orm";
import { db } from "../client";
import {
  checkups,
  pregnancyProfiles,
  pregnancyTodos,
  weightLogs,
  moodLogs,
  type Checkup,
  type PregnancyProfile,
  type PregnancyTodo,
  type WeightLog,
  type MoodLog,
} from "../schema/pregnancy";

const DEFAULT_TODOS = [
  "预约第 25 周产检",
  "补充钙与维生素 D",
  "准备一个孕妇枕",
  "每天散步 20-30 分钟",
  "记录每日体重变化",
  "关注胎动规律",
];

const DEFAULT_CHECKUPS = [
  { label: "第 12 周建档", dateLabel: "6月15日", done: true },
  { label: "第 16 周唐筛", dateLabel: "7月13日", done: true },
  { label: "第 20 周大排畸", dateLabel: "8月10日", done: true },
  { label: "第 25 周常规产检", dateLabel: "9月4日", done: false },
  { label: "第 28 周糖耐", dateLabel: "9月25日", done: false },
];

// Generate demo weight logs for the past 8 weeks
function generateDemoWeightLogs(userId: string) {
  const logs = [];
  const baseWeight = 58;
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    logs.push({
      userId,
      weightKg: String(baseWeight + 0.3 * i + Math.random() * 0.4 - 0.2),
      recordedAt: date,
    });
  }
  return logs;
}

// Generate demo mood logs for the past 8 weeks
const MOODS = ["happy", "calm", "tired", "anxious", "excited"];
function generateDemoMoodLogs(userId: string) {
  const logs = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    logs.push({
      userId,
      mood: MOODS[Math.floor(Math.random() * MOODS.length)],
      recordedAt: date,
    });
  }
  return logs;
}

/** Read the profile; create a seeded one on first access. */
export async function getOrCreateProfile(userId: string): Promise<PregnancyProfile> {
  const existing = await db
    .select()
    .from(pregnancyProfiles)
    .where(eq(pregnancyProfiles.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(pregnancyProfiles)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0];

  const again = await db
    .select()
    .from(pregnancyProfiles)
    .where(eq(pregnancyProfiles.userId, userId))
    .limit(1);
  return again[0];
}

export async function updateProfile(
  userId: string,
  data: Partial<Pick<PregnancyProfile, "week" | "dueDate" | "weightKg" | "mood" | "onboarded">>,
): Promise<PregnancyProfile> {
  await getOrCreateProfile(userId);
  const rows = await db
    .update(pregnancyProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pregnancyProfiles.userId, userId))
    .returning();
  return rows[0];
}

export async function getTodos(userId: string): Promise<PregnancyTodo[]> {
  const rows = await db
    .select()
    .from(pregnancyTodos)
    .where(eq(pregnancyTodos.userId, userId))
    .orderBy(asc(pregnancyTodos.orderIndex), asc(pregnancyTodos.createdAt));
  if (rows.length > 0) return rows;

  await db
    .insert(pregnancyTodos)
    .values(DEFAULT_TODOS.map((label, i) => ({ userId, label, orderIndex: i, done: i === 1 })));
  return db
    .select()
    .from(pregnancyTodos)
    .where(eq(pregnancyTodos.userId, userId))
    .orderBy(asc(pregnancyTodos.orderIndex), asc(pregnancyTodos.createdAt));
}

export async function toggleTodo(userId: string, id: string): Promise<PregnancyTodo | undefined> {
  const current = await db
    .select()
    .from(pregnancyTodos)
    .where(and(eq(pregnancyTodos.userId, userId), eq(pregnancyTodos.id, id)))
    .limit(1);
  if (!current[0]) return undefined;
  const rows = await db
    .update(pregnancyTodos)
    .set({ done: !current[0].done })
    .where(and(eq(pregnancyTodos.userId, userId), eq(pregnancyTodos.id, id)))
    .returning();
  return rows[0];
}

export async function addPregnancyTodo(userId: string, label: string): Promise<PregnancyTodo> {
  const existing = await getTodos(userId);
  const rows = await db
    .insert(pregnancyTodos)
    .values({ userId, label, orderIndex: existing.length })
    .returning();
  return rows[0];
}

export async function getCheckups(userId: string): Promise<Checkup[]> {
  const rows = await db
    .select()
    .from(checkups)
    .where(eq(checkups.userId, userId))
    .orderBy(asc(checkups.orderIndex), asc(checkups.createdAt));
  if (rows.length > 0) return rows;

  await db
    .insert(checkups)
    .values(DEFAULT_CHECKUPS.map((c, i) => ({ userId, ...c, orderIndex: i })));
  return db
    .select()
    .from(checkups)
    .where(eq(checkups.userId, userId))
    .orderBy(asc(checkups.orderIndex), asc(checkups.createdAt));
}

export async function addCheckup(userId: string, data: { label: string; dateLabel?: string }): Promise<Checkup> {
  const existing = await getCheckups(userId);
  const rows = await db
    .insert(checkups)
    .values({ userId, label: data.label, dateLabel: data.dateLabel ?? "", orderIndex: existing.length, done: false })
    .returning();
  return rows[0];
}

export async function deleteCheckup(userId: string, id: string): Promise<void> {
  await db.delete(checkups).where(and(eq(checkups.userId, userId), eq(checkups.id, id)));
}

// Weight logs
export async function getWeightLogs(userId: string): Promise<WeightLog[]> {
  const rows = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(desc(weightLogs.recordedAt));
  if (rows.length > 0) return rows;

  // Seed demo data for demo users
  if (userId.startsWith("roadshow-demo-")) {
    await db.insert(weightLogs).values(generateDemoWeightLogs(userId));
    return db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.recordedAt));
  }
  return [];
}

export async function addWeightLog(userId: string, weightKg: string): Promise<WeightLog> {
  const rows = await db
    .insert(weightLogs)
    .values({ userId, weightKg })
    .returning();
  return rows[0];
}

// Mood logs
export async function getMoodLogs(userId: string): Promise<MoodLog[]> {
  const rows = await db
    .select()
    .from(moodLogs)
    .where(eq(moodLogs.userId, userId))
    .orderBy(desc(moodLogs.recordedAt));
  if (rows.length > 0) return rows;

  // Seed demo data for demo users
  if (userId.startsWith("roadshow-demo-")) {
    await db.insert(moodLogs).values(generateDemoMoodLogs(userId));
    return db
      .select()
      .from(moodLogs)
      .where(eq(moodLogs.userId, userId))
      .orderBy(desc(moodLogs.recordedAt));
  }
  return [];
}

export async function addMoodLog(userId: string, mood: string): Promise<MoodLog> {
  const rows = await db
    .insert(moodLogs)
    .values({ userId, mood })
    .returning();
  return rows[0];
}
