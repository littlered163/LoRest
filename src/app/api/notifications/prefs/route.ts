import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreatePrefs, updatePrefs } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const prefs = await getOrCreatePrefs(auth.user.id);
  return NextResponse.json({ ok: true, prefs });
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as {
    bedtime?: boolean;
    checkup?: boolean;
    weekly?: boolean;
  };

  const data: Record<string, boolean> = {};
  if (typeof body.bedtime === "boolean") data.bedtime = body.bedtime;
  if (typeof body.checkup === "boolean") data.checkup = body.checkup;
  if (typeof body.weekly === "boolean") data.weekly = body.weekly;

  const prefs = await updatePrefs(auth.user.id, data);
  return NextResponse.json({ ok: true, prefs });
}
