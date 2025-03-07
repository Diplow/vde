import { integer, timestamp, text } from "drizzle-orm/pg-core";
import { createTable } from "./utils";
import { users } from "./users";

/**
 * Events table schema
 */
export const events = createTable("events", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  authorId: integer("author_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Event type definitions
 */
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
