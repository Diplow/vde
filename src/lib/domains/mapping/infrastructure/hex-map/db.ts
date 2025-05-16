import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, sql, and } from "drizzle-orm";
import * as schemaImport from "~/server/db/schema"; // Import full schema namespace
import { hexMaps, mapItems, baseItems } from "~/server/db/schema"; // Remove hexMapItems
import type { MapRepository } from "~/lib/domains/mapping/_repositories";
import {
  HexMap,
  MapItem,
  BaseItem,
  type HexMapIdr,
  type MapRelatedItems,
  type MapRelatedLists,
  type MapWithId,
  type BaseItemWithId,
  type MapItemWithId,
} from "~/lib/domains/mapping/_objects"; // Import types from objects
// Import specific attribute types with aliases
import { type Attrs as MapAttrs } from "~/lib/domains/mapping/_objects/hex-map";
import { parsePathString } from "~/lib/domains/mapping/infrastructure/map-item/db";

// Infer DB types from tables
type DbHexMapSelect = typeof hexMaps.$inferSelect;
type DbMapItemSelect = typeof mapItems.$inferSelect;
type DbBaseItemSelect = typeof baseItems.$inferSelect;
type DbHexMapUpdate = typeof hexMaps.$inferInsert; // For update method

// Helper type for DB result with center relation
type DbHexMapWithCenter = DbHexMapSelect & {
  center: DbMapItemSelect & {
    referencedItem: DbBaseItemSelect;
  };
};

export class DbHexMapRepository implements MapRepository {
  private db: PostgresJsDatabase<typeof schemaImport>;

  constructor(db: PostgresJsDatabase<typeof schemaImport>) {
    this.db = db;
  }

  public handleCascading(): boolean {
    return true;
  }

  private async _mapToDomain(
    dbMap: DbHexMapWithCenter,
    dbMapItemsList: (DbMapItemSelect & { referencedItem: DbBaseItemSelect })[],
  ): Promise<MapWithId> {
    const centerDbItem = dbMap.center;
    const centerBaseItem = new BaseItem({
      id: centerDbItem.referencedItem.id,
      attrs: {
        title: centerDbItem.referencedItem.title,
        descr: centerDbItem.referencedItem.descr,
        link: centerDbItem.referencedItem.link ?? "",
      },
    });
    const centerItem = new MapItem({
      id: centerDbItem.id,
      attrs: {
        mapId: centerDbItem.mapId,
        originId: centerDbItem.originId,
        parentId: centerDbItem.parentId,
        coords: {
          row: centerDbItem.row,
          col: centerDbItem.col,
          path: parsePathString(centerDbItem.path),
        },
        size: centerDbItem.size,
        color: centerDbItem.color,
        lightness: centerDbItem.lightness,
        ref: {
          itemType: centerDbItem.refItemType,
          itemId: centerDbItem.refItemId,
        },
      },
      ref: centerBaseItem as BaseItemWithId,
    });

    const domainMapItemsList: MapItemWithId[] = [];
    for (const dbItem of dbMapItemsList) {
      const baseItem = new BaseItem({
        id: dbItem.referencedItem.id,
        attrs: {
          title: dbItem.referencedItem.title,
          descr: dbItem.referencedItem.descr,
          link: dbItem.referencedItem.link ?? "",
        },
      });
      const mapItem = new MapItem({
        id: dbItem.id,
        attrs: {
          mapId: dbItem.mapId,
          originId: dbItem.originId,
          parentId: dbItem.parentId,
          coords: {
            row: dbItem.row,
            col: dbItem.col,
            path: parsePathString(dbItem.path),
          },
          size: dbItem.size,
          color: dbItem.color,
          lightness: dbItem.lightness,
          ref: {
            itemType: dbItem.refItemType,
            itemId: dbItem.refItemId,
          },
        },
        ref: baseItem as BaseItemWithId,
      });
      domainMapItemsList.push(mapItem as MapItemWithId);
    }

    // Ensure center item is included if it wasn't fetched separately
    if (!domainMapItemsList.some((item) => item.id === centerItem.id)) {
      domainMapItemsList.push(centerItem as MapItemWithId);
    }

    const hexMap = new HexMap({
      id: dbMap.id,
      attrs: {
        centerId: dbMap.centerId,
        ownerId: dbMap.ownerId,
        colors: dbMap.colors,
        radius: dbMap.radius,
      },
      center: centerItem as MapItemWithId,
      items: domainMapItemsList,
    });

    const finalMap = hexMap as MapWithId;
    finalMap.attrs.centerId = dbMap.centerId;

    return finalMap;
  }

  // Helper to fetch items for a map ID
  private async _fetchItemsForMap(
    mapId: number,
  ): Promise<(DbMapItemSelect & { referencedItem: DbBaseItemSelect })[]> {
    return this.db.query.mapItems.findMany({
      where: eq(mapItems.mapId, mapId),
      with: {
        referencedItem: true,
      },
    });
  }

  async getOne(id: number): Promise<MapWithId> {
    const result = await this.db.query.hexMaps.findFirst({
      where: eq(hexMaps.id, id), // Use imported table
      with: {
        center: {
          with: {
            referencedItem: true,
          },
        },
      },
    });

    if (!result) {
      throw new Error(`HexMap with id ${id} not found.`);
    }

    const items = await this._fetchItemsForMap(id);
    return this._mapToDomain(result as DbHexMapWithCenter, items);
  }

  async create({
    attrs,
    relatedItems,
    relatedLists,
  }: {
    attrs: MapAttrs;
    relatedItems: MapRelatedItems;
    relatedLists: MapRelatedLists;
  }): Promise<MapWithId> {
    if (!relatedItems.center) {
      throw new Error("Center item must be provided to create a HexMap.");
    }
    const centerItemId = relatedItems.center.id;

    const newMap = await this.db.transaction(async (tx) => {
      const [insertedMap] = await tx
        .insert(hexMaps)
        .values({
          centerId: centerItemId,
          ownerId: attrs.ownerId,
          colors: attrs.colors,
          radius: attrs.radius,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!insertedMap) {
        throw new Error("Failed to create HexMap.");
      }

      // Re-fetch the created map with relations to return the domain object
      const newMapData = await tx.query.hexMaps.findFirst({
        where: eq(hexMaps.id, insertedMap.id), // Use imported table
        with: {
          center: {
            with: {
              referencedItem: true,
            },
          },
        },
      });

      if (!newMapData) {
        // Should not happen if insert succeeded
        throw new Error("Failed to fetch newly created HexMap.");
      }

      // Update the center MapItem to link it back to this HexMap
      await tx
        .update(mapItems) // Use imported table
        .set({
          mapId: insertedMap.id,
          updatedAt: new Date(),
        })
        .where(eq(mapItems.id, centerItemId));

      // Update other provided items to link them to this HexMap
      if (relatedLists.items && relatedLists.items.length > 0) {
        const itemIds = relatedLists.items.map((item) => item.id);
        if (itemIds.length > 0) {
          await tx
            .update(mapItems)
            .set({
              mapId: insertedMap.id,
              updatedAt: new Date(),
            })
            .where(sql`${mapItems.id} IN ${itemIds}`);
        }
      }

      return newMapData;
    });

    // Fetch items separately now
    const items = await this._fetchItemsForMap(newMap.id);
    return this._mapToDomain(newMap as DbHexMapWithCenter, items);
  }

  async update({
    aggregate,
    attrs,
  }: {
    aggregate: MapWithId;
    attrs: Partial<MapAttrs>;
  }): Promise<MapWithId> {
    const updateData: Partial<DbHexMapUpdate> = {
      ...attrs,
      updatedAt: new Date(),
    };

    // Prevent updating immutable fields
    delete updateData.centerId;
    delete updateData.ownerId;

    if (Object.keys(updateData).length <= 1) {
      // Only updatedAt?
      return aggregate; // No actual change
    }

    const [updatedMap] = await this.db
      .update(hexMaps) // Use imported table
      .set(updateData)
      .where(eq(hexMaps.id, aggregate.id)) // Use imported table
      .returning();

    if (!updatedMap) {
      throw new Error(`Failed to update HexMap with id ${aggregate.id}.`);
    }

    // Re-fetch to get updated relations if necessary (though only attrs were changed here)
    return this.getOne(aggregate.id);
  }

  async remove(id: number): Promise<void> {
    // TODO: Need to handle cascade deletes or manual deletion of related items?
    // The schema defines ON DELETE CASCADE for hex_map_items
    // ON DELETE RESTRICT for center Fk in hex_maps
    // Need to potentially delete map items first or ensure the center item isn't the target
    // For now, attempt direct deletion.
    const result = await this.db
      .delete(hexMaps) // Use imported table
      .where(eq(hexMaps.id, id)); // Use imported table

    // Drizzle delete doesn't throw error if not found, check result if needed
    // console.log("Delete result:", result);
  }

  async getByOwnerId({
    ownerId,
    limit = 10,
    offset = 0,
  }: {
    ownerId: number;
    limit?: number;
    offset?: number;
  }): Promise<MapWithId[]> {
    const results = await this.db.query.hexMaps.findMany({
      where: eq(hexMaps.ownerId, ownerId), // Use imported table
      limit: limit,
      offset: offset,
      orderBy: (maps, { desc }) => [desc(maps.updatedAt)],
      with: {
        center: {
          with: {
            referencedItem: true,
          },
        },
      },
    });

    const mapsWithItems = await Promise.all(
      results.map(async (dbMap) => {
        const items = await this._fetchItemsForMap(dbMap.id);
        return this._mapToDomain(dbMap as DbHexMapWithCenter, items);
      }),
    );
    return mapsWithItems;
  }

  async getMany(args: {
    limit?: number | undefined;
    offset?: number | undefined;
  }): Promise<MapWithId[]> {
    const limit = args.limit ?? 10;
    const offset = args.offset ?? 0;

    const results = await this.db.query.hexMaps.findMany({
      limit: limit,
      offset: offset,
      orderBy: (maps, { asc }) => [asc(maps.id)],
      with: {
        center: {
          with: {
            referencedItem: true,
          },
        },
      },
    });

    const mapsWithItems = await Promise.all(
      results.map(async (dbMap) => {
        const items = await this._fetchItemsForMap(dbMap.id);
        return this._mapToDomain(dbMap as DbHexMapWithCenter, items);
      }),
    );
    return mapsWithItems;
  }

  // --- Placeholder/Not Implemented Methods (using Error) ---

  async getOneByIdr(args: {
    idr: HexMapIdr;
    limit?: number | undefined;
    offset?: number | undefined;
  }): Promise<MapWithId> {
    throw new Error("Method not implemented: DbHexMapRepository.getOneByIdr");
  }
  async getManyByIdr(args: {
    idrs: HexMapIdr[];
    limit?: number | undefined;
    offset?: number | undefined;
  }): Promise<MapWithId[]> {
    throw new Error("Method not implemented: DbHexMapRepository.getManyByIdr");
  }
  async updateByIdr(args: {
    idr: HexMapIdr;
    attrs: Partial<MapAttrs>;
  }): Promise<MapWithId> {
    throw new Error("Method not implemented: DbHexMapRepository.updateByIdr");
  }
  async updateRelatedItem<K extends keyof MapRelatedItems>(args: {
    aggregate: MapWithId;
    key: K;
    item: MapRelatedItems[K];
  }): Promise<MapWithId> {
    throw new Error(
      "Method not implemented: DbHexMapRepository.updateRelatedItem",
    );
  }
  async updateRelatedItemByIdr<K extends keyof MapRelatedItems>(args: {
    idr: HexMapIdr;
    key: K;
    item: MapRelatedItems[K];
  }): Promise<MapWithId> {
    throw new Error(
      "Method not implemented: DbHexMapRepository.updateRelatedItemByIdr",
    );
  }
  async addToRelatedList<K extends keyof MapRelatedLists>(args: {
    aggregate: MapWithId;
    key: K;
    item: MapRelatedLists[K] extends (infer ItemType)[] ? ItemType : never;
  }): Promise<MapWithId> {
    if (args.key !== "items") {
      throw new Error(
        `addToRelatedList not supported for key: ${String(args.key)}`,
      );
    }

    const mapItemToAdd = args.item as MapItemWithId;
    if (!args.aggregate.id || !mapItemToAdd.id) {
      throw new Error(
        "Aggregate and item must have IDs to add to related list.",
      );
    }

    // Update the mapItem's mapId directly
    await this.db
      .update(mapItems)
      .set({ mapId: args.aggregate.id, updatedAt: new Date() })
      .where(eq(mapItems.id, mapItemToAdd.id));

    // Refetch the map to include the new item in its list
    return this.getOne(args.aggregate.id);
  }
  async addToRelatedListByIdr<K extends keyof MapRelatedLists>(args: {
    idr: HexMapIdr;
    key: K;
    item: MapRelatedLists[K] extends (infer ItemType)[] ? ItemType : never;
  }): Promise<MapWithId> {
    throw new Error(
      "Method not implemented: DbHexMapRepository.addToRelatedListByIdr",
    );
  }
  async removeFromRelatedList<K extends keyof MapRelatedLists>(args: {
    aggregate: MapWithId;
    key: K;
    itemId: number;
  }): Promise<MapWithId> {
    if (args.key !== "items") {
      throw new Error(
        `removeFromRelatedList not supported for key: ${String(args.key)}`,
      );
    }

    if (!args.aggregate.id) {
      throw new Error("Aggregate must have an ID to remove item link.");
    }

    // Set the mapItem's mapId to null
    await this.db
      .update(mapItems)
      .set({ mapId: null, updatedAt: new Date() })
      .where(
        and(
          eq(mapItems.id, args.itemId),
          eq(mapItems.mapId, args.aggregate.id),
        ),
      ); // Ensure it belongs to this map

    // Refetch the map to reflect the removed item
    return this.getOne(args.aggregate.id);
  }
  async removeFromRelatedListByIdr<K extends keyof MapRelatedLists>(args: {
    idr: HexMapIdr;
    key: K;
    itemId: number;
  }): Promise<MapWithId> {
    throw new Error(
      "Method not implemented: DbHexMapRepository.removeFromRelatedListByIdr",
    );
  }
  async removeByIdr(args: { idr: HexMapIdr }): Promise<void> {
    // throw new Error("Method not implemented: DbHexMapRepository.removeByIdr");
    if (!("id" in args.idr)) {
      // This specific remove action expects the ID variant of the identifier
      throw new Error(
        `DbHexMapRepository.removeByIdr called with incompatible identifier: ${JSON.stringify(
          args.idr,
        )}`,
      );
    }
    const mapId = args.idr.id;

    if (!mapId) {
      throw new Error("Cannot remove HexMap without ID.");
    }

    await this.db.transaction(async (tx) => {
      // Fetch the map to get the centerId
      const map = await tx.query.hexMaps.findFirst({
        where: eq(hexMaps.id, mapId),
        columns: { centerId: true },
      });

      if (!map) {
        // Map doesn't exist, nothing to remove
        console.warn(`HexMap with id ${mapId} not found for removal.`);
        return;
      }

      // 2. Delete the HexMap itself
      await tx.delete(hexMaps).where(eq(hexMaps.id, mapId));

      // 3. Delete the center MapItem (assuming it's not used elsewhere)
      // NOTE: This is potentially DANGEROUS if the center item IS reused.
      // The CASCADE on mapItems.mapId should handle deleting items linked to the map.
      /*
      if (map.centerId) {
        const centerItem = await tx.query.mapItems.findFirst({
          where: eq(mapItems.id, map.centerId),
          columns: { refItemId: true },
        });
        await tx.delete(mapItems).where(eq(mapItems.id, map.centerId));
        if (centerItem?.refItemId) {
          await tx
            .delete(baseItems)
            .where(eq(baseItems.id, centerItem.refItemId));
        }
      }
      */
    });
  }
}
