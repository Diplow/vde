import { relations } from "drizzle-orm";
import { mapItems } from "./_tables/mapping/map-items";
import { baseItems } from "./_tables/mapping/base-items";
import { userMapping } from "./_tables/mapping/user-mapping";
import { users } from "./_tables/auth/users";
import { accounts } from "./_tables/auth/accounts";
import { sessions } from "./_tables/auth/sessions";

/**
 * Relations for map_items table
 */
export const mapItemRelations = relations(mapItems, ({ one, many }) => ({
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

/**
 * Relations for user_mapping table
 */
export const userMappingRelations = relations(userMapping, ({ one }) => ({
  // Many-to-one: UserMapping -> User (auth user)
  authUser: one(users, {
    fields: [userMapping.authUserId],
    references: [users.id],
  }),
}));

// Relations for Auth tables
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  // One-to-one: User -> UserMapping (for mapping to integer IDs)
  userMapping: one(userMapping, {
    fields: [users.id],
    references: [userMapping.authUserId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
