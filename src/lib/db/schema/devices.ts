import type { InferSelectModel } from "drizzle-orm";
import { boolean, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

/** Paired mattress devices, per user. */
export const devices = pgTable(
  "devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    model: varchar("model", { length: 60 }).notNull().default("Z1"),
    bluetoothName: varchar("bluetooth_name", { length: 120 }),
    online: boolean("online").notNull().default(true),
    lastSyncAt: timestamp("last_sync_at").notNull().defaultNow(),
    settings: varchar("settings", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("devices_user_idx").on(table.userId),
  }),
);

export type Device = InferSelectModel<typeof devices>;
