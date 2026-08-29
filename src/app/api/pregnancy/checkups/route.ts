import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCheckups, addCheckup, deleteCheckup } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const checkups = await getCheckups(auth.user.id);
  return NextResponse.json({ ok: true, checkups });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { label?: string; dateLabel?: string };
  if (!body.label || body.label.length > 120)
    return NextResponse.json({ ok: false, error: "invalid label" }, { status: 400 });
  const checkup = await addCheckup(auth.user.id, {
    label: body.label,
    dateLabel: body.dateLabel ?? "",
  });
  return NextResponse.json({ ok: true, checkup });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id)
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  await deleteCheckup(auth.user.id, body.id);
  return NextResponse.json({ ok: true });
}
