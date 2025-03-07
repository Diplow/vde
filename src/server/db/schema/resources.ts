import { integer, timestamp, varchar, text } from "drizzle-orm/pg-core";
import { createTable } from "./utils";

/**
 * Resources table schema
 */
export const resources = createTable("resource", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  url: varchar("url", { length: 2048 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Resource type definitions
 */
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
