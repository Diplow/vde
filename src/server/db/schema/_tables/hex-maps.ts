import {
  integer,
  timestamp,
  jsonb,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createTable } from "../_utils";
// import { users } from "./users"; // Assuming users table exists
import { mapItems } from "./map-items";
import type {
  HexMapColors,
  HexMapRadius,
} from "~/lib/domains/mapping/_objects/hex-map";

// Remove old enums if they exist
// export const ownerTypeEnum = pgEnum("owner_type", ["user", "organization"]);

/**
 * HexMaps table schema
 */
export const hexMaps = createTable(
  "hex_maps",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    centerId: integer("center_id").notNull(), // FK defined below
    ownerId: integer("owner_id").notNull(), // FK defined below - assuming users table
    colors: jsonb("colors").$type<HexMapColors>().notNull(),
    radius: integer("radius").$type<HexMapRadius>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      centerFk: foreignKey({
        columns: [table.centerId],
        foreignColumns: [mapItems.id],
      }).onDelete("restrict"), // Don't allow deleting the center item if it's part of a map
      // ownerFk: foreignKey({
      //   columns: [table.ownerId],
      //   foreignColumns: [users.id], // Assumes users.id exists
      // }).onDelete("cascade"), // Cascade delete maps if owner is deleted

      centerIdx: index("hex_map_center_idx").on(table.centerId),
      ownerIdx: index("hex_map_owner_idx").on(table.ownerId),
    };
  },
);

// Remove or update old type definitions
// export type HexMap = typeof maps.$inferSelect;
// export type NewMap = typeof maps.$inferInsert;
