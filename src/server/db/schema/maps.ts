import { integer, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { createTable } from "./utils";

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
  ownerId: integer("owner_id").notNull(),
  ownerType: ownerTypeEnum("owner_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Map type definitions
 */
export type Map = typeof maps.$inferSelect;
export type NewMap = typeof maps.$inferInsert;
