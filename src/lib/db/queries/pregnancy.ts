import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { pregnancyProfiles, weightLogs, type PregnancyProfile, type WeightLog } from "../schema/pregnancy";
import { weekFromLMP, dueDateFromLMP } from "@/lib/lorest/sleep";

/** Client-facing profile view: week/dueDate derived from LMP when set. */
export interface ProfileView {
  userId: string;
  week: number;
  dueDate: string;
  weightKg: string | null;
  pregnancyStartDate: string | null;
  initialWeightKg: string | null;
  heightCm: string | null;
  onboarded: boolean;
}

export function toProfileDto(p: PregnancyProfile): ProfileView {
  const lmp = p.pregnancyStartDate;
  if (lmp) {
    return {
      userId: p.userId,
      week: weekFromLMP(lmp),
      dueDate: dueDateFromLMP(lmp),
      weightKg: p.weightKg,
      pregnancyStartDate: lmp,
      initialWeightKg: p.initialWeightKg,
      heightCm: p.heightCm,
      onboarded: p.onboarded,
    };
  }
  return {
    userId: p.userId,
    week: p.week,
    dueDate: p.dueDate,
    weightKg: p.weightKg,
    pregnancyStartDate: null,
    initialWeightKg: p.initialWeightKg,
    heightCm: p.heightCm,
    onboarded: p.onboarded,
  };
}

// Generate demo weight logs: ~8 weeks of readings every 2 days, a gentle upward
// trend so the last-7-days chart and the "gain vs. pre-pregnancy" label look real.
function generateDemoWeightLogs(userId: string) {
  const logs = [];
  const now = new Date();
  const total = 28; // every 2 days over ~8 weeks
  for (let i = total - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 2);
    const base = 59 + ((total - 1 - i) / total) * 2.5; // 59 → 61.5 kg
    logs.push({
      userId,
      weightKg: String(Math.round((base + (Math.random() * 0.4 - 0.2)) * 10) / 10),
      recordedAt: date,
    });
  }
  return logs;
}

/** Read the profile; create a seeded one on first access. */
export async function getOrCreateProfile(userId: string): Promise<ProfileView> {
  const existing = await db
    .select()
    .from(pregnancyProfiles)
    .where(eq(pregnancyProfiles.userId, userId))
    .limit(1);
  if (existing[0]) return toProfileDto(existing[0]);

  const inserted = await db
    .insert(pregnancyProfiles)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return toProfileDto(inserted[0]);

  const again = await db
    .select()
    .from(pregnancyProfiles)
    .where(eq(pregnancyProfiles.userId, userId))
    .limit(1);
  return toProfileDto(again[0]);
}

export async function updateProfile(
  userId: string,
  data: Partial<Pick<PregnancyProfile, "pregnancyStartDate" | "initialWeightKg" | "heightCm" | "weightKg" | "onboarded">>,
): Promise<ProfileView> {
  await getOrCreateProfile(userId);
  const rows = await db
    .update(pregnancyProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(pregnancyProfiles.userId, userId))
    .returning();
  return toProfileDto(rows[0]);
}

// Weight logs
export async function getWeightLogs(userId: string): Promise<WeightLog[]> {
  const rows = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(desc(weightLogs.recordedAt));
  if (rows.length > 0) return rows;

  // Seed demo data for demo users. generateDemoWeightLogs pushes oldest→newest,
  // so reverse to match the API's newest-first order (saves one round-trip).
  if (userId.startsWith("roadshow-demo-")) {
    const inserted = await db
      .insert(weightLogs)
      .values(generateDemoWeightLogs(userId))
      .returning();
    return inserted.reverse();
  }
  return [];
}

export async function addWeightLog(userId: string, weightKg: string, recordedAt?: Date): Promise<WeightLog> {
  const rows = await db
    .insert(weightLogs)
    .values({ userId, weightKg, ...(recordedAt ? { recordedAt } : {}) })
    .returning();
  return rows[0];
}
