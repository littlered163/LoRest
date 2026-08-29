import { request } from "./request";
import { cached, invalidateCache } from "./cache";

export interface PregnancyProfileDto {
  userId: string;
  week: number;
  dueDate: string;
  weightKg: string | null;
  pregnancyStartDate: string | null;
  initialWeightKg: string | null;
  heightCm: string | null;
  onboarded: boolean;
}

export interface WeightLogDto {
  id: string;
  weightKg: string;
  recordedAt: string;
}

// Profile & weight change rarely; cache for 60s so revisits don't pay the
// cross-region DB round-trip every time. Saves/inserts invalidate explicitly.
const CACHE_TTL_MS = 60_000;

export async function fetchProfile(): Promise<PregnancyProfileDto> {
  return cached("profile", CACHE_TTL_MS, async () => {
    const res = await request("/api/pregnancy/profile");
    if (!res.ok) throw new Error("failed to load profile");
    const data = (await res.json()) as { profile: PregnancyProfileDto };
    return data.profile;
  });
}

export async function saveProfile(
  patch: Partial<Pick<PregnancyProfileDto, "pregnancyStartDate">> & {
    initialWeightKg?: number | string;
    heightCm?: number | string;
    weightKg?: number | string;
    onboarded?: boolean;
  },
): Promise<PregnancyProfileDto> {
  const res = await request("/api/pregnancy/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("failed to save profile");
  const data = (await res.json()) as { profile: PregnancyProfileDto };
  invalidateCache("profile");
  return data.profile;
}

export async function fetchWeightLogs(): Promise<WeightLogDto[]> {
  return cached("weight-logs", CACHE_TTL_MS, async () => {
    const res = await request("/api/pregnancy/weight");
    if (!res.ok) throw new Error("failed to load weight logs");
    const data = (await res.json()) as { logs: WeightLogDto[] };
    return data.logs;
  });
}

export async function addWeightLogApi(weightKg: string, recordedAt?: string): Promise<WeightLogDto> {
  const res = await request("/api/pregnancy/weight", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ weightKg, recordedAt }),
  });
  if (!res.ok) throw new Error("failed to add weight log");
  const data = (await res.json()) as { log: WeightLogDto };
  invalidateCache("weight-logs");
  return data.log;
}
