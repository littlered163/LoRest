import { request } from "./request";

export interface PregnancyProfileDto {
  userId: string;
  week: number;
  dueDate: string;
  weightKg: string | null;
  mood: string | null;
  onboarded: boolean;
}

export interface PregnancyTodoDto {
  id: string;
  label: string;
  done: boolean;
  orderIndex: number;
}

export interface CheckupDto {
  id: string;
  label: string;
  dateLabel: string;
  done: boolean;
  orderIndex: number;
}

export interface WeightLogDto {
  id: string;
  weightKg: string;
  recordedAt: string;
}

export interface MoodLogDto {
  id: string;
  mood: string;
  recordedAt: string;
}

export async function fetchProfile(): Promise<PregnancyProfileDto> {
  const res = await request("/api/pregnancy/profile");
  if (!res.ok) throw new Error("failed to load profile");
  const data = (await res.json()) as { profile: PregnancyProfileDto };
  return data.profile;
}

export async function saveProfile(
  patch: Partial<Pick<PregnancyProfileDto, "week" | "dueDate">> & {
    weightKg?: number | string;
    mood?: string;
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
  return data.profile;
}

export async function fetchTodos(): Promise<PregnancyTodoDto[]> {
  const res = await request("/api/pregnancy/todos");
  if (!res.ok) throw new Error("failed to load todos");
  const data = (await res.json()) as { todos: PregnancyTodoDto[] };
  return data.todos;
}

export async function addTodoApi(label: string): Promise<PregnancyTodoDto> {
  const res = await request("/api/pregnancy/todos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error("failed to add todo");
  const data = (await res.json()) as { todo: PregnancyTodoDto };
  return data.todo;
}

export async function toggleTodoApi(id: string): Promise<PregnancyTodoDto> {
  const res = await request("/api/pregnancy/todos", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("failed to toggle todo");
  const data = (await res.json()) as { todo: PregnancyTodoDto };
  return data.todo;
}

export async function fetchCheckups(): Promise<CheckupDto[]> {
  const res = await request("/api/pregnancy/checkups");
  if (!res.ok) throw new Error("failed to load checkups");
  const data = (await res.json()) as { checkups: CheckupDto[] };
  return data.checkups;
}

export async function addCheckupApi(label: string, dateLabel?: string): Promise<CheckupDto> {
  const res = await request("/api/pregnancy/checkups", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label, dateLabel }),
  });
  if (!res.ok) throw new Error("failed to add checkup");
  const data = (await res.json()) as { checkup: CheckupDto };
  return data.checkup;
}

export async function deleteCheckupApi(id: string): Promise<void> {
  const res = await request("/api/pregnancy/checkups", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("failed to delete checkup");
}

export async function fetchWeightLogs(): Promise<WeightLogDto[]> {
  const res = await request("/api/pregnancy/weight");
  if (!res.ok) throw new Error("failed to load weight logs");
  const data = (await res.json()) as { logs: WeightLogDto[] };
  return data.logs;
}

export async function addWeightLogApi(weightKg: string, recordedAt?: string): Promise<WeightLogDto> {
  const res = await request("/api/pregnancy/weight", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ weightKg, recordedAt }),
  });
  if (!res.ok) throw new Error("failed to add weight log");
  const data = (await res.json()) as { log: WeightLogDto };
  return data.log;
}

export async function fetchMoodLogs(): Promise<MoodLogDto[]> {
  const res = await request("/api/pregnancy/mood");
  if (!res.ok) throw new Error("failed to load mood logs");
  const data = (await res.json()) as { logs: MoodLogDto[] };
  return data.logs;
}

export async function addMoodLogApi(mood: string): Promise<MoodLogDto> {
  const res = await request("/api/pregnancy/mood", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mood }),
  });
  if (!res.ok) throw new Error("failed to add mood log");
  const data = (await res.json()) as { log: MoodLogDto };
  return data.log;
}
