import { integer, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { createTable } from "./utils";
import { users } from "./users";

/**
 * Owner type enum
 */
export const ownerTypeEnum = pgEnum("owner_type", ["user", "organization"]);

/**
 * Maps table schema
 */
export const maps = createTable("maps", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.clerkId),
  ownerType: ownerTypeEnum("owner_type").notNull(),
  rows: integer("rows").notNull().default(10),
  columns: integer("columns").notNull().default(10),
  baseSize: integer("base_size").notNull().default(50),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Map type definitions
 */
export type Map = typeof maps.$inferSelect;
export type NewMap = typeof maps.$inferInsert;
