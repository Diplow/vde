import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { EventEntity } from "~/lib/domains/politics/entities";
import { EventRepository } from "~/lib/domains/politics/repositories";
import * as schema from "~/server/db/schema";

export const EventDrizzlePostgresRepository = (
  db: PostgresJsDatabase<typeof schema>,
): EventRepository => {
  return {
    getOne: async (eventId: number) => {
      const event = await db.query.events.findFirst({
        where: eq(schema.events.id, eventId),
      });

      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      return new EventEntity(event);
    },

    getMany: async (limit = 50, offset = 0) => {
      const eventsData = await db.query.events.findMany({
        limit,
        offset,
        orderBy: [schema.events.startDate],
      });

      return eventsData.map((event) => new EventEntity(event));
    },

    create: async (
      title: string,
      description: string | null,
      startDate: Date,
      endDate: Date,
      authorId: number,
    ) => {
      const [insertedEvent] = await db
        .insert(schema.events)
        .values({
          title,
          description,
          startDate,
          endDate,
          authorId,
        })
        .returning();

      if (!insertedEvent) {
        throw new Error("Failed to create event: No event returned");
      }

      return new EventEntity(insertedEvent);
    },

    update: async (
      eventId: number,
      data: {
        title?: string;
        description?: string | null;
        startDate?: Date;
        endDate?: Date;
      },
    ) => {
      const [updatedEvent] = await db
        .update(schema.events)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schema.events.id, eventId))
        .returning();

      if (!updatedEvent) {
        throw new Error("Failed to update event: No event returned");
      }

      return new EventEntity(updatedEvent);
    },

    remove: async (eventId: number) => {
      const result = await db
        .delete(schema.events)
        .where(eq(schema.events.id, eventId))
        .returning({ id: schema.events.id });

      if (result.length === 0) {
        throw new Error(
          `Event with ID ${eventId} not found or already deleted`,
        );
      }
    },
  };
};
