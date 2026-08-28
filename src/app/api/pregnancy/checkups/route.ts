import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCheckups } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const checkups = await getCheckups(auth.user.id);
  return NextResponse.json({ ok: true, checkups });
}
