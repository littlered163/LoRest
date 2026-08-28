import type { InferSelectModel } from "drizzle-orm";
import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

/** One row per user: their notification preferences. */
export const notificationPrefs = pgTable("notification_prefs", {
  userId: varchar("user_id", { length: 128 })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bedtime: boolean("bedtime").notNull().default(true),
  checkup: boolean("checkup").notNull().default(true),
  weekly: boolean("weekly").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type NotificationPref = InferSelectModel<typeof notificationPrefs>;
