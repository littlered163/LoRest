import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateProfile, updateProfile } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const profile = await getOrCreateProfile(auth.user.id);
  return NextResponse.json({ ok: true, profile });
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    week?: number;
    dueDate?: string;
    weightKg?: number | string;
    mood?: string;
    onboarded?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.week === "number" && body.week >= 4 && body.week <= 42) data.week = body.week;
  if (typeof body.dueDate === "string" && body.dueDate.length <= 32) data.dueDate = body.dueDate;
  if (body.weightKg !== undefined) data.weightKg = String(body.weightKg);
  if (typeof body.mood === "string" && body.mood.length <= 32) data.mood = body.mood;
  if (typeof body.onboarded === "boolean") data.onboarded = body.onboarded;

  const profile = await updateProfile(auth.user.id, data);
  return NextResponse.json({ ok: true, profile });
}
