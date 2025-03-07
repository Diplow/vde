import { integer, timestamp, text } from "drizzle-orm/pg-core";
import { createTable, mapOwnersEnum } from "./utils";
import { users } from "./users";

/**
 * Maps table schema
 */
export const maps = createTable("maps", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id")
    .references(() => users.id)
    .notNull(),
  ownerType: mapOwnersEnum("owner_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Map type definitions
 */
export type Map = typeof maps.$inferSelect;
export type NewMap = typeof maps.$inferInsert;
