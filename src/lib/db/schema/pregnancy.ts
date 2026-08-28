import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/** One row per user: their pregnancy profile + quick log. */
export const pregnancyProfiles = pgTable(
  "pregnancy_profiles",
  {
    userId: varchar("user_id", { length: 128 })
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    week: integer("week").notNull().default(24),
    dueDate: varchar("due_date", { length: 32 }).notNull().default("12月17日"),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }),
    mood: varchar("mood", { length: 32 }),
    onboarded: boolean("onboarded").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export type PregnancyProfile = InferSelectModel<typeof pregnancyProfiles>;

/** This-week to-do items, per user. */
export const pregnancyTodos = pgTable(
  "pregnancy_todos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    done: boolean("done").notNull().default(false),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("pregnancy_todos_user_idx").on(table.userId),
  }),
);

export type PregnancyTodo = InferSelectModel<typeof pregnancyTodos>;

/** Check-up reminders, per user. */
export const checkups = pgTable(
  "checkups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    dateLabel: varchar("date_label", { length: 32 }).notNull(),
    done: boolean("done").notNull().default(false),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("checkups_user_idx").on(table.userId),
  }),
);

export type Checkup = InferSelectModel<typeof checkups>;
