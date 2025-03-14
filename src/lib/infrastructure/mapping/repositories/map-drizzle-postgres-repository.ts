import { eq, and } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  MapAggregate,
  OwnerEntity,
  OwnerAttributes,
  MapItemAggregate,
  MapItemReference,
  MapItemType,
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
        new MapItemAggregate(
          {
            id: item.id,
            mapId: item.mapId,
            coordinates: item.coordinates as HexCoordinate,
            reference: {
              id: item.itemId,
              type: item.itemType as MapItemType,
            },
            createdAt: new Date(), // Default to current date as the schema doesn't have this
            updatedAt: new Date(), // Default to current date as the schema doesn't have this
          },
          new OwnerEntity({
            id: map.ownerId, // Use the map's owner as the item's owner
          }),
          [], // Empty related items
        ),
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
      owner: OwnerAttributes,
      rows?: number,
      columns?: number,
      baseSize?: number,
    ) => {
      const [insertedMap] = await db
        .insert(maps)
        .values({
          name,
          description,
          ownerId: owner.id,
          ownerType: "user",
          rows: rows ?? 10,
          columns: columns ?? 10,
          baseSize: baseSize ?? 50,
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

    addItem: async (
      mapId: number,
      coordinates: HexCoordinate,
      reference: MapItemReference,
      ownerId: string,
    ) => {
      // First check if the map exists
      const map = await db.query.maps.findFirst({
        where: eq(maps.id, mapId),
      });

      if (!map) {
        throw new Error(`Map with ID ${mapId} not found`);
      }

      // Validate the coordinates and reference
      MapItemAggregate.validateCoordinates(coordinates);
      MapItemAggregate.validateReference(reference);

      // Insert the new map item
      const [insertedItem] = await db
        .insert(mapItems)
        .values({
          mapId,
          itemId: Number(reference.id),
          itemType: reference.type,
          coordinates: coordinates,
        })
        .returning();

      if (!insertedItem) {
        throw new Error("Failed to create map item: No item returned");
      }

      // Create and return the domain entity
      return new MapItemAggregate(
        {
          id: insertedItem.id,
          mapId: insertedItem.mapId,
          coordinates: insertedItem.coordinates as HexCoordinate,
          reference: {
            id: insertedItem.itemId,
            type: insertedItem.itemType as MapItemType,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        new OwnerEntity({
          id: ownerId,
        }),
        [], // No related items initially
      );
    },

    removeItem: async (mapId: number, reference: MapItemReference) => {
      // Validate the reference
      MapItemAggregate.validateReference(reference);

      const result = await db
        .delete(mapItems)
        .where(
          and(
            eq(mapItems.mapId, mapId),
            eq(mapItems.itemId, Number(reference.id)),
            eq(mapItems.itemType, reference.type),
          ),
        )
        .returning({ id: mapItems.id });

      if (result.length === 0) {
        throw new Error(
          `Map item with reference ID ${reference.id} and type ${reference.type} not found or already deleted`,
        );
      }
    },
  };
};
