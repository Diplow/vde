import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { MapEntity } from "~/lib/domains/mapping/entities";
import { MapRepository } from "~/lib/domains/mapping/repositories";
import * as schema from "~/server/db/schema";

export const MapDrizzlePostgresRepository = (
  db: PostgresJsDatabase<typeof schema>,
): MapRepository => {
  return {
    getOne: async (mapId: number) => {
      const map = await db.query.maps.findFirst({
        where: eq(schema.maps.id, mapId),
      });

      if (!map) {
        throw new Error(`Map with ID ${mapId} not found`);
      }

      return new MapEntity(map);
    },

    getMany: async (limit = 50, offset = 0) => {
      const mapsData = await db.query.maps.findMany({
        limit,
        offset,
        orderBy: [schema.maps.createdAt],
      });

      return mapsData.map((map) => new MapEntity(map));
    },

    getByOwnerId: async (ownerId: number, limit = 50, offset = 0) => {
      const mapsData = await db.query.maps.findMany({
        where: eq(schema.maps.ownerId, ownerId),
        limit,
        offset,
        orderBy: [schema.maps.createdAt],
      });

      return mapsData.map((map) => new MapEntity(map));
    },

    create: async (
      name: string,
      description: string | null,
      ownerId: number,
      ownerType: string,
    ) => {
      const [insertedMap] = await db
        .insert(schema.maps)
        .values({
          name,
          description,
          ownerId,
          ownerType: ownerType as "user",
        })
        .returning();

      if (!insertedMap) {
        throw new Error("Failed to create map: No map returned");
      }

      return new MapEntity(insertedMap);
    },

    update: async (
      mapId: number,
      data: {
        name?: string;
        description?: string | null;
      },
    ) => {
      const [updatedMap] = await db
        .update(schema.maps)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schema.maps.id, mapId))
        .returning();

      if (!updatedMap) {
        throw new Error("Failed to update map: No map returned");
      }

      return new MapEntity(updatedMap);
    },

    remove: async (mapId: number) => {
      const result = await db
        .delete(schema.maps)
        .where(eq(schema.maps.id, mapId))
        .returning({ id: schema.maps.id });

      if (result.length === 0) {
        throw new Error(`Map with ID ${mapId} not found or already deleted`);
      }
    },
  };
};
