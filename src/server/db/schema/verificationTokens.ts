import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm"; // Relations will be added later

// Core Verification schema from better-auth (named verification_tokens here):
// id: string (PK)
// identifier: string (e.g., email for password reset, user ID for email verification)
// value: string (The token value itself)
// expiresAt: Date
// createdAt: Date
// updatedAt: Date

export const verificationTokens = pgTable("verification_tokens", {
  id: text("id").primaryKey(), // better-auth generates string IDs
  identifier: text("identifier").notNull(), // What this token is for, e.g. user's email or ID
  value: text("value").notNull().unique(), // Changed from token to value, and made unique
  expiresAt: timestamp("expires_at", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

// According to better-auth core schema, it has `identifier` and `value`.
// Auth.js (a similar library) uses `identifier` and `token` for its VerificationToken schema.
// And `token` is usually the unique part.
// The better-auth Drizzle adapter docs show mapping `verificationToken: schema.verificationTokens`
// This suggests `verificationTokens` is the expected table name by the adapter if using `usePlural` or explicit mapping.
// I'm using `token` for the value field to align with common patterns (like Auth.js) and making it unique.
// If `better-auth` strictly expects `value`, this might need adjustment.
// The core schema table for `verification` lists `value` as the token column.
// Let's stick to `value` as per the core schema description for the column name.
