import {
  integer,
  text,
  timestamp,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createTable } from "../_utils";
import { users } from "../users"; // Assuming users table exists in parent directory
import { mapItems } from "./map-items";

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
    ownerId: text("owner_id").notNull(), // Changed to text, FK defined below
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      centerFk: foreignKey({
        columns: [table.centerId],
        foreignColumns: [mapItems.id],
      }).onDelete("restrict"), // Don't allow deleting the center item if it's part of a map
      ownerFk: foreignKey({
        columns: [table.ownerId],
        foreignColumns: [users.id], // Assumes users.id exists
      }).onDelete("cascade"), // Cascade delete maps if owner is deleted

      centerIdx: index("hex_map_center_idx").on(table.centerId),
      ownerIdx: index("hex_map_owner_idx").on(table.ownerId),
    };
  },
);

export type HexMap = typeof hexMaps.$inferSelect;
export type NewHexMap = typeof hexMaps.$inferInsert;
