import { and, asc, eq } from "drizzle-orm";
import { db } from "../client";
import {
  checkups,
  pregnancyProfiles,
  pregnancyTodos,
  type Checkup,
  type PregnancyProfile,
  type PregnancyTodo,
} from "../schema/pregnancy";

const DEFAULT_TODOS = [
  "预约第 25 周产检",
  "补充钙与维生素 D",
  "准备一个孕妇枕",
];

const DEFAULT_CHECKUPS = [
  { label: "第 25 周常规产检", dateLabel: "9月4日", done: false },
  { label: "大排畸超声", dateLabel: "8月10日", done: true },
];

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
