import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  MapAggregate,
  OwnerEntity,
  OwnerEntityAttributes,
  MapItemEntity,
} from "~/lib/domains/mapping/objects";
import { MapRepository } from "~/lib/domains/mapping/repositories";
import { HexCoordinate } from "~/lib/hex-coordinates";
import * as schema from "~/server/db/schema";
import { maps } from "~/server/db/schema/maps";
import { mapItems } from "~/server/db/schema/map-items";

export const MapDrizzlePostgresRepository = (
  db: PostgresJsDatabase<typeof schema>,
): MapRepository => {
  /**
   * Adapts a database map record with its items to a MapAggregate instance
   */
  const adapt = (
    map: typeof maps.$inferSelect & {
      items?: (typeof mapItems.$inferSelect)[];
    },
  ): MapAggregate => {
    const owner = new OwnerEntity({
      id: map.ownerId,
    });

    // Convert database map items to MapItemEntity instances
    const items = (map.items || []).map(
      (item) =>
        new MapItemEntity({
          id: item.id,
          itemId: item.itemId,
          itemType: item.itemType,
          coordinates: item.coordinates as HexCoordinate,
        }),
    );

    return new MapAggregate(map, owner, items);
  };

  return {
    getOne: async (mapId: number) => {
      const result = await db.query.maps.findFirst({
        where: eq(maps.id, mapId),
        with: {
          items: true,
        },
      });

      if (!result) {
        throw new Error(`Map with ID ${mapId} not found`);
      }

      return adapt(result);
    },

    getMany: async (limit = 50, offset = 0) => {
      const mapsData = await db.query.maps.findMany({
        limit,
        offset,
        orderBy: [maps.createdAt],
        with: {
          items: true,
        },
      });

      return mapsData.map(adapt);
    },

    getByOwnerId: async (ownerId: string, limit = 50, offset = 0) => {
      const mapsData = await db.query.maps.findMany({
        where: eq(maps.ownerId, ownerId),
        limit,
        offset,
        orderBy: [maps.createdAt],
        with: {
          items: true,
        },
      });

      return mapsData.map(adapt);
    },

    create: async (
      name: string,
      description: string | null,
      owner: OwnerEntityAttributes,
      dimensions?: {
        rows?: number;
        columns?: number;
        baseSize?: number;
      },
    ) => {
      const [insertedMap] = await db
        .insert(maps)
        .values({
          name,
          description,
          ownerId: owner.id,
          ownerType: "user",
          rows: dimensions?.rows ?? 10,
          columns: dimensions?.columns ?? 10,
          baseSize: dimensions?.baseSize ?? 50,
        })
        .returning();

      if (!insertedMap) {
        throw new Error("Failed to create map: No map returned");
      }

      // Add empty items array for newly created maps
      return adapt({ ...insertedMap, items: [] });
    },

    update: async (
      mapId: number,
      data: {
        name?: string;
        description?: string | null;
        rows?: number;
        columns?: number;
        baseSize?: number;
      },
    ) => {
      const [updatedMap] = await db
        .update(maps)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(maps.id, mapId))
        .returning();

      if (!updatedMap) {
        throw new Error("Failed to update map: No map returned");
      }

      // Fetch the map items after update
      const mapItemsData = await db
        .select()
        .from(mapItems)
        .where(eq(mapItems.mapId, mapId));

      return adapt({ ...updatedMap, items: mapItemsData });
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
