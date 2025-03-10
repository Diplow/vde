import { relations } from "drizzle-orm";
import { maps } from "./maps";
import { mapItems } from "./map-items";

/**
 * Define relations for maps
 */
export const mapsRelations = relations(maps, ({ many }) => ({
  items: many(mapItems),
}));

/**
 * Define relations for map items
 */
export const mapItemsRelations = relations(mapItems, ({ one }) => ({
  map: one(maps, {
    fields: [mapItems.mapId],
    references: [maps.id],
  }),
}));
