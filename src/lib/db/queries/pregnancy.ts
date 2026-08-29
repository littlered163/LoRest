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

/** Seed values so demo accounts always open with a complete pregnancy profile. */
function demoProfileSeed() {
  const lmp = new Date();
  lmp.setDate(lmp.getDate() - 196); // ~28 weeks along
  return {
    pregnancyStartDate: lmp.toISOString().slice(0, 10),
    initialWeightKg: "58",
    heightCm: "165",
    weightKg: "61.2",
    onboarded: true,
  };
}

/** Read the profile; create a fully seeded one on first access. */
export async function getOrCreateProfile(userId: string): Promise<ProfileView> {
  const isDemo = userId.startsWith("roadshow-demo-");
  const existing = await db
    .select()
    .from(pregnancyProfiles)
    .where(eq(pregnancyProfiles.userId, userId))
    .limit(1);

  // A demo account missing any seeded field (e.g. created before seeding
  // existed, or only partly warmed by the login flow) gets backfilled with
  // the seeded profile — keeping any values already set.
  if (existing[0]) {
    const row = existing[0];
    if (isDemo && !(row.pregnancyStartDate && row.initialWeightKg && row.heightCm && row.weightKg && row.onboarded)) {
      const seed = demoProfileSeed();
      const fixed = await db
        .update(pregnancyProfiles)
        .set({
          pregnancyStartDate: row.pregnancyStartDate ?? seed.pregnancyStartDate,
          initialWeightKg: row.initialWeightKg ?? seed.initialWeightKg,
          heightCm: row.heightCm ?? seed.heightCm,
          weightKg: row.weightKg ?? seed.weightKg,
          onboarded: true,
          updatedAt: new Date(),
        })
        .where(eq(pregnancyProfiles.userId, userId))
        .returning();
      return toProfileDto(fixed[0]);
    }
    return toProfileDto(row);
  }

  const inserted = await db
    .insert(pregnancyProfiles)
    .values({ userId, ...(isDemo ? demoProfileSeed() : {}) })
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
