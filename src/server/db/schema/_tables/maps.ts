import {
  integer,
  timestamp,
  jsonb,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createTable } from "../_utils";
import { users } from "./users";
import { mapItems } from "./map-items";
import type {
  HexMapColors,
  HexMapRadius,
} from "~/lib/domains/mapping/_objects/hex-map";

/**
 * HexMaps table schema
 */
export const hexMaps = createTable(
  "hex_maps",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    centerId: integer("center_id").notNull(),
    ownerId: integer("owner_id").notNull(),
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
      }).onDelete("restrict"),
      ownerFk: foreignKey({
        columns: [table.ownerId],
        foreignColumns: [users.id],
      }).onDelete("cascade"),

      centerIdx: index("hex_map_center_idx").on(table.centerId),
      ownerIdx: index("hex_map_owner_idx").on(table.ownerId),
    };
  },
);
