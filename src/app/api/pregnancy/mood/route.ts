import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMoodLogs, addMoodLog } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const logs = await getMoodLogs(auth.user.id);
  return NextResponse.json({ ok: true, logs });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { mood?: string };
  if (!body.mood)
    return NextResponse.json({ ok: false, error: "invalid mood" }, { status: 400 });
  const log = await addMoodLog(auth.user.id, body.mood);
  return NextResponse.json({ ok: true, log });
}
