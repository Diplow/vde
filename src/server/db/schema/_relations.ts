import { relations } from "drizzle-orm";
import { hexMaps } from "./_tables/hex-maps";
import { mapItems } from "./_tables/map-items";
import { baseItems } from "./_tables/base-items";
// Assuming users table relations might be defined elsewhere
// import { users } from "./_tables/users";

/**
 * Relations for hex_maps table
 */
export const hexMapRelations = relations(hexMaps, ({ one, many }) => ({
  // One-to-one: HexMap -> Center MapItem
  center: one(mapItems, {
    fields: [hexMaps.centerId],
    references: [mapItems.id],
  }),

  // Assuming one-to-many: User -> HexMaps (owner)
  // owner: one(users, {
  //   fields: [hexMaps.ownerId],
  //   references: [users.id],
  // }),
}));

/**
 * Relations for map_items table
 */
export const mapItemRelations = relations(mapItems, ({ one, many }) => ({
  // Many-to-one: MapItem -> HexMap (which map it belongs to)
  hexMap: one(hexMaps, {
    fields: [mapItems.mapId], // centerId on mapItem links to the *map* id
    references: [hexMaps.id],
  }),

  // Many-to-one: MapItem -> BaseItem (referenced item)
  referencedItem: one(baseItems, {
    fields: [mapItems.refItemId],
    references: [baseItems.id],
  }),

  // Self-referencing relationships
  // Many-to-one: MapItem -> Parent MapItem
  parent: one(mapItems, {
    fields: [mapItems.parentId],
    references: [mapItems.id],
    relationName: "parentItem", // Alias for self-relation
  }),
  // Many-to-one: MapItem -> Origin MapItem
  origin: one(mapItems, {
    fields: [mapItems.originId],
    references: [mapItems.id],
    relationName: "originItem", // Alias for self-relation
  }),
  // One-to-many: MapItem -> Children MapItems
  children: many(mapItems, {
    relationName: "parentItem", // Corresponds to parent relationName
  }),
  // One-to-many: MapItem -> Copies MapItems
  copies: many(mapItems, {
    relationName: "originItem", // Corresponds to origin relationName
  }),
}));

/**
 * Relations for base_items table
 */
export const baseItemRelations = relations(baseItems, ({ many }) => ({
  // One-to-many: BaseItem -> Referencing MapItems
  mapItems: many(mapItems),
}));
