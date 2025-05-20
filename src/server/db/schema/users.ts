import {
  pgTable,
  text,
  timestamp,
  boolean,
  // varchar, // Not using varchar if text is fine for email/name/image
} from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm"; // Relations will be added later

// Core User schema from better-auth:
// id: string (PK)
// name: string
// email: string
// emailVerified: boolean
// image: string?
// createdAt: Date
// updatedAt: Date

export const users = pgTable("users", {
  id: text("id").primaryKey(), // better-auth typically generates string IDs (e.g., UUIDs)
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Relations to other tables (accounts, sessions, etc.) will be defined
// in a central place (e.g., schema/index.ts or after all tables are defined)
// to avoid circular dependencies and ensure all types are available.

// Note: better-auth expects string IDs.
// hashedPassword is NOT on this table as per better-auth core schema; it's on the 'accounts' table.
// emailVerified now .notNull() as it has a default.
