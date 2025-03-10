// Re-export all tables and types from individual files
export * from "./utils";
export { resources, type Resource, type NewResource } from "./resources";
export { users, type User, type NewUser } from "./users";
export { maps, ownerTypeEnum, type Map, type NewMap } from "./maps";
export {
  mapItems,
  itemTypeEnum,
  type MapItem,
  type NewMapItem,
} from "./map-items";
export { events, type Event, type NewEvent } from "./events";

// Export relations
export { mapsRelations, mapItemsRelations } from "./relations";

// Import and re-export the drizzle-orm query functions
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./index";

// This is used to prepare the query builder
export const db = drizzle(postgres(""), { schema }) as PostgresJsDatabase<
  typeof schema
>;
