import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  // Notifications are handled by the platform in production.
  // Locally this is a no-op stub so the route still compiles and returns 200.
  return NextResponse.json({ ok: true, delivered: 0, publishId: "local-stub" });
}
