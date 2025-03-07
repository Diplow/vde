import { integer } from "drizzle-orm/pg-core";
import { createTable } from "./utils";
import { maps } from "./maps";
import { resources } from "./resources";

/**
 * Map Resources junction table schema
 */
export const mapResources = createTable("map_resources", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  mapId: integer("map_id").references(() => maps.id),
  resourceId: integer("resource_id").references(() => resources.id),
});

/**
 * MapResource type definitions
 */
export type MapResource = typeof mapResources.$inferSelect;
export type NewMapResource = typeof mapResources.$inferInsert;
