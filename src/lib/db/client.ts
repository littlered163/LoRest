import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config({ path: ".env" });

const client = postgres(
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/myapp"
);

// The DB is a cross-region Supabase pooler: establishing the TLS connection
// takes ~5s, and the pooler recycles idle connections. Warm the connection at
// module load and keep it alive so the first "one-click demo" request from any
// device doesn't pay the connect penalty.
void client`select 1`.catch(() => undefined);
let keepaliveStarted = false;
function startKeepalive() {
  if (keepaliveStarted) return;
  keepaliveStarted = true;
  const timer = setInterval(() => {
    void client`select 1`.catch(() => undefined);
  }, 30_000);
  timer.unref();
}
startKeepalive();

export const db = drizzle(client);
