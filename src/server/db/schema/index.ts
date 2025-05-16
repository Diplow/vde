// Core Aggregates
export { baseItems } from "./_tables/base-items";
export { mapItems } from "./_tables/map-items";
export { hexMaps } from "./_tables/hex-maps";

export {
  // Existing Relations (ensure this path is correct and file exists)
  baseItemRelations,
  mapItemRelations,
  hexMapRelations,
  // Add new auth relations
  usersRelations,
  accountsRelations,
  sessionsRelations,
} from "./_relations";

// Auth tables for better-auth
export * from "./users";
export * from "./accounts";
export * from "./sessions";
export * from "./verificationTokens";

// Relations for Auth tables
// MOVED TO _relations.ts
// import { relations } from "drizzle-orm";
// import { users } from "./users";
// import { accounts } from "./accounts";
// import { sessions } from "./sessions";

// export const usersRelations = relations(users, ({ many }) => ({
//   accounts: many(accounts),
//   sessions: many(sessions),
//   // hexMaps: many(hexMaps), // Example: if users own hexMaps
// }));

// export const accountsRelations = relations(accounts, ({ one }) => ({
//   user: one(users, {
//     fields: [accounts.userId],
//     references: [users.id],
//   }),
// }));

// export const sessionsRelations = relations(sessions, ({ one }) => ({
//   user: one(users, {
//     fields: [sessions.userId],
//     references: [users.id],
//   }),
// }));

// Ensure that if hexMaps relates to users, that relation is defined,
// possibly in ./_relations or here if appropriate.
// For example, if hexMaps has an ownerId:
// import { hexMaps } from "./_tables/hex-maps"; // already exported above
// export const hexMapsOwnedByUsersRelations = relations(hexMaps, ({ one }) => ({
//   owner: one(users, {
//     fields: [hexMaps.ownerId],
//     references: [users.id],
//   }),
// }));
