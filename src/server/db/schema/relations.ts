import { relations } from "drizzle-orm";
import { integer } from "drizzle-orm/pg-core";
import { maps } from "./maps";
import { mapItems } from "./map-items";
import { createTable } from "./utils";
import { contents } from "./content";
import { resources } from "./resources";
import { events } from "./events";

/**
 * Content-Resource relation table
 */
export const contentResources = createTable("content_resources", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  contentId: integer("content_id")
    .references(() => contents.id)
    .notNull(),
  resourceId: integer("resource_id")
    .references(() => resources.id)
    .notNull(),
});

/**
 * Content-Event relation table
 */
export const contentEvents = createTable("content_events", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  contentId: integer("content_id")
    .references(() => contents.id)
    .notNull(),
  eventId: integer("event_id")
    .references(() => events.id)
    .notNull(),
});

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

/**
 * Define relations for contents
 */
export const contentsRelations = relations(contents, ({ many }) => ({
  resources: many(contentResources),
  events: many(contentEvents),
}));

/**
 * Define relations for content-resources
 */
export const contentResourcesRelations = relations(
  contentResources,
  ({ one }) => ({
    content: one(contents, {
      fields: [contentResources.contentId],
      references: [contents.id],
    }),
    resource: one(resources, {
      fields: [contentResources.resourceId],
      references: [resources.id],
    }),
  }),
);

/**
 * Define relations for content-events
 */
export const contentEventsRelations = relations(contentEvents, ({ one }) => ({
  content: one(contents, {
    fields: [contentEvents.contentId],
    references: [contents.id],
  }),
  event: one(events, {
    fields: [contentEvents.eventId],
    references: [events.id],
  }),
}));

/**
 * Relation type definitions
 */
export type ContentResource = typeof contentResources.$inferSelect;
export type NewContentResource = typeof contentResources.$inferInsert;

export type ContentEvent = typeof contentEvents.$inferSelect;
export type NewContentEvent = typeof contentEvents.$inferInsert;
