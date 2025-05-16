import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users"; // Import for foreign key
// import { relations } from "drizzle-orm"; // Relations will be added later

// Core Session schema from better-auth:
// id: string (PK)
// userId: string (FK to user)
// token: string (Session token)
// expiresAt: Date
// ipAddress: string?
// userAgent: string?
// createdAt: Date
// updatedAt: Date

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // better-auth generates string IDs
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(), // Session token should be unique
  expiresAt: timestamp("expires_at", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

// export const sessionsRelations = relations(sessions, ({ one }) => ({
//   user: one(users, {
//     fields: [sessions.userId],
//     references: [users.id],
//   }),
// }));
