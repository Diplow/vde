import { integer, text, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createTable } from "./utils";
import { maps } from "./maps";

/**
 * Item type enum
 */
export const itemTypeEnum = pgEnum("item_type", ["resource", "event"]);

/**
 * Map items table schema
 */
export const mapItems = createTable("map_items", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  mapId: integer("map_id")
    .references(() => maps.id)
    .notNull(),
  itemId: integer("item_id").notNull(),
  itemType: itemTypeEnum("item_type").notNull(),
  coordinates: jsonb("coordinates").notNull(), // Store HexCoordinate as JSON
});

/**
 * Map item type definitions
 */
export type MapItem = typeof mapItems.$inferSelect;
export type NewMapItem = typeof mapItems.$inferInsert;
