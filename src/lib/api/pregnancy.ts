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
