import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * One row per user: their pregnancy profile.
 * `pregnancyStartDate` (last menstrual period) is the source of truth; `week`
 * and `dueDate` are derived from it on read and kept only as a fallback for
 * profiles that predate the LMP field.
 */
export const pregnancyProfiles = pgTable(
  "pregnancy_profiles",
  {
    userId: varchar("user_id", { length: 128 })
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    week: integer("week").notNull().default(24),
    dueDate: varchar("due_date", { length: 32 }).notNull().default("12月17日"),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
    pregnancyStartDate: date("pregnancy_start_date", { mode: "string" }),
    initialWeightKg: numeric("initial_weight_kg", { precision: 5, scale: 1 }),
    heightCm: numeric("height_cm", { precision: 5, scale: 1 }),
    onboarded: boolean("onboarded").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export type PregnancyProfile = InferSelectModel<typeof pregnancyProfiles>;

/** Weight log entries, per user. */
export const weightLogs = pgTable(
  "weight_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }).notNull(),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("weight_logs_user_idx").on(table.userId),
  }),
);

export type WeightLog = InferSelectModel<typeof weightLogs>;
