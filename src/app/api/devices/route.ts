import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addDevice, getDevices, removeDevice, syncDevice } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const devices = await getDevices(auth.user.id);
  return NextResponse.json({ ok: true, devices });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    model?: string;
    bluetoothName?: string;
  };
  if (!body.name || body.name.length > 120)
    return NextResponse.json({ ok: false, error: "invalid name" }, { status: 400 });
  const device = await addDevice(auth.user.id, {
    name: body.name,
    model: body.model,
    bluetoothName: body.bluetoothName ?? null,
  });
  return NextResponse.json({ ok: true, device });
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  const device = await syncDevice(auth.user.id, body.id);
  if (!device) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, device });
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  await removeDevice(auth.user.id, body.id);
  return NextResponse.json({ ok: true });
}
