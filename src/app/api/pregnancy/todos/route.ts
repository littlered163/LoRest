import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addPregnancyTodo, getTodos, toggleTodo } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const todos = await getTodos(auth.user.id);
  return NextResponse.json({ ok: true, todos });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { label?: string };
  const label = body.label?.trim();
  if (!label || label.length > 80)
    return NextResponse.json({ ok: false, error: "invalid label" }, { status: 400 });
  const todo = await addPregnancyTodo(auth.user.id, label);
  return NextResponse.json({ ok: true, todo });
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  const todo = await toggleTodo(auth.user.id, body.id);
  if (!todo) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, todo });
}
