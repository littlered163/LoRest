import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWeightLogs, addWeightLog } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const logs = await getWeightLogs(auth.user.id);
  return NextResponse.json({ ok: true, logs });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { weightKg?: string; recordedAt?: string };
  if (!body.weightKg)
    return NextResponse.json({ ok: false, error: "invalid weight" }, { status: 400 });
  let recordedAt: Date | undefined;
  if (body.recordedAt) {
    recordedAt = new Date(body.recordedAt);
    if (Number.isNaN(recordedAt.getTime()))
      return NextResponse.json({ ok: false, error: "invalid date" }, { status: 400 });
  }
  const log = await addWeightLog(auth.user.id, body.weightKg, recordedAt);
  return NextResponse.json({ ok: true, log });
}
