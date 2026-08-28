import { eq } from "drizzle-orm";
import { db } from "../client";
import { notificationPrefs, type NotificationPref } from "../schema/notifications";

export async function getOrCreatePrefs(userId: string): Promise<NotificationPref> {
  const existing = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(notificationPrefs)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0];

  const again = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);
  return again[0];
}

export async function updatePrefs(
  userId: string,
  data: Partial<Pick<NotificationPref, "bedtime" | "checkup" | "weekly">>,
): Promise<NotificationPref> {
  await getOrCreatePrefs(userId);
  const rows = await db
    .update(notificationPrefs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notificationPrefs.userId, userId))
    .returning();
  return rows[0];
}
