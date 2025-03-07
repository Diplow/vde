import { integer, timestamp, text } from "drizzle-orm/pg-core";
import { createTable } from "./utils";

/**
 * Users table schema
 */
export const users = createTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * User type definitions
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
