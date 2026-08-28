export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; response: Response };

interface HeaderRequest {
  headers: { get(name: string): string | null };
}

export function requireAuth(request: HeaderRequest): AuthResult {
  const token = request.headers.get("x-lorest-session");
  if (!token) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    };
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const user = JSON.parse(decoded) as User;
    if (!user.id) throw new Error("missing id");
    return { ok: true, user };
  } catch {
    return {
      ok: false,
      response: new Response(JSON.stringify({ ok: false, error: "invalid session" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    };
  }
}
