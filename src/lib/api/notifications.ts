import { request } from "./request";

export interface NotificationPrefsDto {
  userId: string;
  bedtime: boolean;
  checkup: boolean;
  weekly: boolean;
}

export type NotificationPrefKey = "bedtime" | "checkup" | "weekly";

export async function fetchPrefs(): Promise<NotificationPrefsDto> {
  const res = await request("/api/notifications/prefs");
  if (!res.ok) throw new Error("failed to load prefs");
  const data = (await res.json()) as { prefs: NotificationPrefsDto };
  return data.prefs;
}

export async function savePrefs(
  patch: Partial<Record<NotificationPrefKey, boolean>>,
): Promise<NotificationPrefsDto> {
  const res = await request("/api/notifications/prefs", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("failed to save prefs");
  const data = (await res.json()) as { prefs: NotificationPrefsDto };
  return data.prefs;
}
