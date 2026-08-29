// Client-side in-memory cache with TTL, keyed by session so different demo
// users never see each other's data. Profile and weight data change rarely,
// so a short TTL avoids re-fetching from the (cross-region) DB on every visit.
const SESSION_KEY = "lorest.session";
const store = new Map<string, { data: unknown; at: number }>();

function sessionScope(): string {
  if (typeof window === "undefined") return "anon";
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return "anon";
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? "anon";
  } catch {
    return "anon";
  }
}

/** Fetch through cache: reuse the stored value within `ttlMs`, else fetch + store. */
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const k = `${sessionScope()}:${key}`;
  const hit = store.get(k);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const data = await fetcher();
  store.set(k, { data, at: Date.now() });
  return data;
}

/** Drop cached entries. With no key, clears everything for the current session. */
export function invalidateCache(key?: string): void {
  const scope = sessionScope();
  for (const k of store.keys()) {
    const inScope = k.startsWith(`${scope}:`);
    if (key === undefined ? inScope : k === `${scope}:${key}`) store.delete(k);
  }
}
