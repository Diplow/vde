import {
  integer,
  varchar,
  timestamp,
  index,
  foreignKey,
  type PgTableExtraConfig,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createTable } from "../_utils";
import { hexMaps } from "./hex-maps"; // Correct filename based on ls
import { baseItems } from "./base-items";
import { MapItemType } from "~/lib/domains/mapping/_objects/map-item"; // Import the enum

/**
 * HexMap items table schema
 */
export const mapItems = createTable(
  "map_items",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    mapId: integer("map_id"), // Nullable FK to hex_maps
    originId: integer("origin_id"), // Nullable FK to map_items (self)
    parentId: integer("parent_id"), // Nullable FK to map_items (self)
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    path: varchar("path", { length: 20 }).notNull().default(""), // Store path as string, e.g., "NESW"

    // Reference to the underlying BaseItem (or potentially other types in future)
    refItemType: varchar("ref_item_type", { length: 10 })
      .$type<MapItemType>()
      .notNull(), // Store MapItemType enum as varchar
    refItemId: integer("ref_item_id").notNull(), // FK to base_items

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table): PgTableExtraConfig => {
    return {
      // Define Foreign Keys
      mapFk: foreignKey({
        columns: [table.mapId],
        foreignColumns: [hexMaps.id],
      }).onDelete("cascade"),
      originFk: foreignKey({
        columns: [table.originId],
        foreignColumns: [table.id], // Self-reference
      }).onDelete("set null"),
      parentFk: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id], // Self-reference
      }).onDelete("set null"),
      refItemFk: foreignKey({
        columns: [table.refItemId],
        foreignColumns: [baseItems.id],
      }).onDelete("restrict"),

      // Define Indexes
      mapIdx: index("map_item_map_idx").on(table.mapId),
      originIdx: index("map_item_origin_idx").on(table.originId),
      parentIdx: index("map_item_parent_idx").on(table.parentId),
      refItemIdx: index("map_item_ref_item_idx").on(table.refItemId),

      // Unique constraint for coordinates within a map
      uniqueCoords: uniqueIndex("map_item_unique_coords_idx").on(
        table.mapId,
        table.row,
        table.col,
        table.path,
      ),
    };
  },
);

/**
 * HexMap item type definitions
 */
export type MapItem = typeof mapItems.$inferSelect;
export type NewMapItem = typeof mapItems.$inferInsert;
