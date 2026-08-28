import { and, asc, eq } from "drizzle-orm";
import { db } from "../client";
import { devices, type Device } from "../schema/devices";

export async function getDevices(userId: string): Promise<Device[]> {
  return db
    .select()
    .from(devices)
    .where(eq(devices.userId, userId))
    .orderBy(asc(devices.createdAt));
}

export async function addDevice(
  userId: string,
  data: { name: string; model?: string; bluetoothName?: string | null },
): Promise<Device> {
  const rows = await db
    .insert(devices)
    .values({
      userId,
      name: data.name,
      model: data.model ?? "Z1",
      bluetoothName: data.bluetoothName ?? null,
      online: true,
      lastSyncAt: new Date(),
    })
    .returning();
  return rows[0];
}

/** Mark an online device as freshly synced (called when the app is open). */
export async function syncDevice(userId: string, id: string): Promise<Device | undefined> {
  const rows = await db
    .update(devices)
    .set({ online: true, lastSyncAt: new Date() })
    .where(and(eq(devices.userId, userId), eq(devices.id, id)))
    .returning();
  return rows[0];
}

export async function removeDevice(userId: string, id: string): Promise<void> {
  await db.delete(devices).where(and(eq(devices.userId, userId), eq(devices.id, id)));
}
