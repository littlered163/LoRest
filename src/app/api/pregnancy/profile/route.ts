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
    pregnancyStartDate?: string;
    initialWeightKg?: number | string;
    heightCm?: number | string;
    weightKg?: number | string;
    onboarded?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.pregnancyStartDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.pregnancyStartDate)) {
    data.pregnancyStartDate = body.pregnancyStartDate;
  }
  if (body.initialWeightKg !== undefined) data.initialWeightKg = String(body.initialWeightKg);
  if (body.heightCm !== undefined) data.heightCm = String(body.heightCm);
  if (body.weightKg !== undefined) data.weightKg = String(body.weightKg);
  if (typeof body.onboarded === "boolean") data.onboarded = body.onboarded;

  const profile = await updateProfile(auth.user.id, data);
  return NextResponse.json({ ok: true, profile });
}
