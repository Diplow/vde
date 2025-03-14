import { eq, and, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  ContentAggregate,
  AuthorEntity,
  OwnerEntity,
  EventEntity,
  OwnerAttributes,
} from "~/lib/domains/ideas/objects";
import { ContentRepository } from "~/lib/domains/ideas/repositories";
import * as schema from "~/server/db/schema";
import { contents } from "~/server/db/schema/content";
import { contentEvents } from "~/server/db/schema/relations";
import { events } from "~/server/db/schema/events";
import { users } from "~/server/db/schema/users";

export const ContentDrizzlePostgresRepository = (
  db: PostgresJsDatabase<typeof schema>,
): ContentRepository => {
  /**
   * Adapts a database content record with its relationships to a ContentAggregate instance
   */
  const adapt = async (
    content: typeof contents.$inferSelect & {
      events?: (typeof events.$inferSelect)[];
    },
  ): Promise<ContentAggregate> => {
    // Get the author (which is a YouTube channel in this case, not a user)
    // In a real implementation, we would fetch the author from a YouTube API or author table
    // For now, we'll create a simple author entity with the ID
    const author = new AuthorEntity({
      id: content.authorId,
      name: "YouTube Channel", // This would come from a real author table or API
    });

    // Get the owner (the VDE user who created the content)
    const ownerRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, content.authorId),
    });

    const owner = new OwnerEntity({
      id: content.authorId,
      name: ownerRecord?.firstName || content.authorId,
    });

    // Convert database events to EventEntity instances
    const mentionedEvents: EventEntity[] = (content.events || []).map(
      (event) =>
        new EventEntity({
          id: event.id,
          title: event.title,
          description: event.description || "",
          date: event.startDate, // Use startDate from the database as date
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }),
    );

    // We would also fetch related contents here, but for simplicity we'll keep it empty
    const relatedContents: ContentAggregate[] = [];

    return new ContentAggregate(
      {
        id: content.id,
        title: content.title,
        description: content.description,
        youtubeVideoId: content.youtubeVideoId,
        viewCount: content.viewCount || 0,
        authorId: content.authorId,
        ownerId: content.authorId, // Using authorId as ownerId for now
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      },
      author,
      owner,
      mentionedEvents,
      relatedContents,
    );
  };

  return {
    getOne: async (contentId: number) => {
      const result = await db.query.contents.findFirst({
        where: eq(contents.id, contentId),
        with: {
          events: {
            columns: {
              contentId: false,
              id: false,
            },
            with: {
              event: true,
            },
          },
        },
      });

      if (!result) {
        throw new Error(`Content with ID ${contentId} not found`);
      }

      // Transform the result to match the expected format
      const eventsData = result.events?.map((relation) => relation.event) || [];
      const contentWithEvents = { ...result, events: eventsData };

      return await adapt(contentWithEvents);
    },

    getMany: async (limit = 50, offset = 0) => {
      const contentResults = await db.query.contents.findMany({
        limit,
        offset,
        orderBy: [contents.createdAt],
        with: {
          events: {
            columns: {
              contentId: false,
              id: false,
            },
            with: {
              event: true,
            },
          },
        },
      });

      // Transform the results to match the expected format
      const transformedResults = contentResults.map((result) => {
        const eventsData =
          result.events?.map((relation) => relation.event) || [];
        return { ...result, events: eventsData };
      });

      return Promise.all(transformedResults.map(adapt));
    },

    getByOwnerId: async (ownerId: string, limit = 50, offset = 0) => {
      const contentResults = await db.query.contents.findMany({
        where: eq(contents.authorId, ownerId), // Using authorId as ownerId for now
        limit,
        offset,
        orderBy: [contents.createdAt],
        with: {
          events: {
            columns: {
              contentId: false,
              id: false,
            },
            with: {
              event: true,
            },
          },
        },
      });

      // Transform the results to match the expected format
      const transformedResults = contentResults.map((result) => {
        const eventsData =
          result.events?.map((relation) => relation.event) || [];
        return { ...result, events: eventsData };
      });

      return Promise.all(transformedResults.map(adapt));
    },

    getByAuthorId: async (authorId: string, limit = 50, offset = 0) => {
      const contentResults = await db.query.contents.findMany({
        where: eq(contents.authorId, authorId),
        limit,
        offset,
        orderBy: [contents.createdAt],
        with: {
          events: {
            columns: {
              contentId: false,
              id: false,
            },
            with: {
              event: true,
            },
          },
        },
      });

      // Transform the results to match the expected format
      const transformedResults = contentResults.map((result) => {
        const eventsData =
          result.events?.map((relation) => relation.event) || [];
        return { ...result, events: eventsData };
      });

      return Promise.all(transformedResults.map(adapt));
    },

    create: async (
      title: string,
      description: string | null,
      youtubeVideoId: string,
      viewCount: number,
      author: AuthorEntity,
      owner: OwnerAttributes,
      mentionedEvents: EventEntity[] = [],
    ) => {
      // Insert the content
      const [insertedContent] = await db
        .insert(contents)
        .values({
          title,
          description,
          youtubeVideoId,
          viewCount,
          authorId: owner.id, // Using the owner ID as the author ID for now
        })
        .returning();

      if (!insertedContent) {
        throw new Error("Failed to create content: No content returned");
      }

      // Add relationships for mentioned events
      if (mentionedEvents.length > 0) {
        await Promise.all(
          mentionedEvents.map(async (event) => {
            await db.insert(contentEvents).values({
              contentId: insertedContent.id,
              eventId: event.data.id,
            });
          }),
        );
      }

      // Fetch the events from the database to ensure we have the correct structure
      let eventsData: (typeof events.$inferSelect)[] = [];

      if (mentionedEvents.length > 0) {
        const eventIds = mentionedEvents.map((event) => event.data.id);
        const eventRecords = await db.query.events.findMany({
          where: sql`id IN ${eventIds}`,
        });
        eventsData = eventRecords;
      }

      // Create a properly structured content with events
      const contentWithEvents = {
        ...insertedContent,
        events: eventsData,
      };

      return await adapt(contentWithEvents);
    },

    update: async (
      contentId: number,
      data: {
        title?: string;
        description?: string | null;
        youtubeVideoId?: string;
        viewCount?: number;
      },
    ) => {
      // Update the content
      const [updatedContent] = await db
        .update(contents)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(contents.id, contentId))
        .returning();

      if (!updatedContent) {
        throw new Error(`Failed to update content with ID ${contentId}`);
      }

      // Get the events after update
      const eventRelations = await db.query.contentEvents.findMany({
        where: eq(contentEvents.contentId, contentId),
        with: {
          event: true,
        },
      });

      const eventsData = eventRelations.map((relation) => relation.event);
      const contentWithEvents = { ...updatedContent, events: eventsData };

      return await adapt(contentWithEvents);
    },

    addMentionedEvent: async (contentId: number, event: EventEntity) => {
      // Check if the content exists
      const content = await db.query.contents.findFirst({
        where: eq(contents.id, contentId),
      });

      if (!content) {
        throw new Error(`Content with ID ${contentId} not found`);
      }

      // Check if the relationship already exists to avoid duplicates
      const existingRelation = await db.query.contentEvents.findFirst({
        where: and(
          eq(contentEvents.contentId, contentId),
          eq(contentEvents.eventId, event.data.id),
        ),
      });

      if (existingRelation) {
        return; // Relationship already exists, nothing to do
      }

      // Add the relationship
      await db.insert(contentEvents).values({
        contentId,
        eventId: event.data.id,
      });
    },

    removeMentionedEvent: async (contentId: number, eventId: number) => {
      // Check if the content exists
      const content = await db.query.contents.findFirst({
        where: eq(contents.id, contentId),
      });

      if (!content) {
        throw new Error(`Content with ID ${contentId} not found`);
      }

      // Remove the relationship
      const result = await db
        .delete(contentEvents)
        .where(
          and(
            eq(contentEvents.contentId, contentId),
            eq(contentEvents.eventId, eventId),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new Error(
          `Relationship between content ${contentId} and event ${eventId} not found`,
        );
      }
    },

    remove: async (contentId: number) => {
      // First remove all related records in the join tables
      await db
        .delete(contentEvents)
        .where(eq(contentEvents.contentId, contentId));

      // Then remove the content
      const result = await db
        .delete(contents)
        .where(eq(contents.id, contentId))
        .returning();

      if (result.length === 0) {
        throw new Error(
          `Content with ID ${contentId} not found or already deleted`,
        );
      }
    },
  };
};
