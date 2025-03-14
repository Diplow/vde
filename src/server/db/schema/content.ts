import { integer, timestamp, varchar, text } from "drizzle-orm/pg-core";
import { createTable } from "./utils";
import { users } from "./users";

/**
 * Contents table schema for YouTube videos
 */
export const contents = createTable("contents", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
  viewCount: integer("view_count").default(0),
  authorId: text("author_id")
    .notNull()
    .references(() => users.clerkId),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Content type definitions
 */
export type Content = typeof contents.$inferSelect;
export type NewContent = typeof contents.$inferInsert;
