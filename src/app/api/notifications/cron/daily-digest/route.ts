import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Notifications are handled by the platform in production; local stub.
  return NextResponse.json({ ok: true, delivered: 0, publishId: "local-stub" });
}
