// Re-export all tables and types from individual files
export * from "./utils";
export { users, type User, type NewUser } from "./users";
export { maps, ownerTypeEnum, type Map, type NewMap } from "./maps";
export {
  mapItems,
  itemTypeEnum,
  type MapItem,
  type NewMapItem,
} from "./map-items";
export { resources, type Resource, type NewResource } from "./resources";
export { events, type Event, type NewEvent } from "./events";
export { contents, type Content, type NewContent } from "./content";

// Export relations
export {
  mapsRelations,
  mapItemsRelations,
  contentsRelations,
  contentResourcesRelations,
  contentEventsRelations,
  contentResources,
  contentEvents,
  type ContentResource,
  type NewContentResource,
  type ContentEvent,
  type NewContentEvent,
} from "./relations";
