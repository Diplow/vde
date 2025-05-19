import { eq, inArray, SQL, sql } from "drizzle-orm";

import {
  type Attrs,
  type MapItemIdr,
  type MapItemWithId,
  type RelatedItems,
  type RelatedLists,
  MapItem,
  MapItemConstructorArgs,
} from "~/lib/domains/mapping/_objects/map-item";
import { BaseItem } from "~/lib/domains/mapping/_objects/base-item";
import { HexDirection } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { MapItemRepository } from "~/lib/domains/mapping/_repositories";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schemaImport from "~/server/db/schema";
import { mapItems, baseItems } from "~/server/db/schema";
import type { BaseItemWithId } from "~/lib/domains/mapping/_objects/base-item";

// Infer DB types
type DbMapItemSelect = Omit<typeof mapItems.$inferSelect, "coords"> & {
  row: number;
  col: number;
  path: string;
};
type DbBaseItemSelect = typeof baseItems.$inferSelect;

// Joined result type
type DbMapItemWithBase = {
  map_items: DbMapItemSelect;
  base_items: DbBaseItemSelect;
};

// Updated Mapping function to accept neighbors
function mapJoinedDbToDomain(
  joined: DbMapItemWithBase,
  neighbors: MapItemWithId[] = [], // Add optional neighbors parameter
): MapItemWithId {
  const dbMapItem = joined.map_items;
  const dbBaseItem = joined.base_items;

  if (!dbBaseItem) {
    throw new Error(
      `BaseItem data missing for MapItem ID ${dbMapItem.id} (refItemId: ${dbMapItem.refItemId})`,
    );
  }

  // BaseItem needs to conform to BaseItemWithId for MapItem constructor
  const baseItem: BaseItemWithId = new BaseItem({
    id: dbBaseItem.id,
    attrs: {
      title: dbBaseItem.title,
      descr: dbBaseItem.descr,
      link: dbBaseItem.link ?? "",
    },
  }) as BaseItemWithId; // Assert type after construction if necessary

  const mapItemArgs: MapItemConstructorArgs = {
    id: dbMapItem.id,
    attrs: {
      mapId: dbMapItem.mapId,
      originId: dbMapItem.originId,
      parentId: dbMapItem.parentId,
      coords: {
        row: dbMapItem.row,
        col: dbMapItem.col,
        path: parsePathString(dbMapItem.path),
      },
      // ref attribute within attrs is derived, not directly passed here
      ref: {
        itemType: dbMapItem.refItemType,
        itemId: dbMapItem.refItemId,
      },
    },
    ref: baseItem, // Pass the BaseItemWithId instance
    neighbors: neighbors, // Pass the neighbors list
    // Parent and Origin are typically loaded separately or via joins if needed,
    // For simplicity, we'll pass null here. A more robust solution
    // might involve fetching them based on parentId/originId if required by the domain object.
    parent: null,
    origin: null,
  };

  // Instantiate MapItem using the constructor arguments
  const mapItem = new MapItem(mapItemArgs);

  return mapItem as MapItemWithId;
}

// Placeholder path conversion functions
function pathToString(path: HexDirection[]): string {
  return path.join(","); // Simple join, e.g., [NE, S] -> "NE,S"
}
export function parsePathString(pathString: string): HexDirection[] {
  // TODO: Implement robust path string parsing back to HexDirection[]
  // Convert comma-separated string back to array of HexDirection values
  return pathString
    ? (pathString.split(",").map(Number) as HexDirection[])
    : [];
}

export class DbMapItemRepository implements MapItemRepository {
  private db: PostgresJsDatabase<typeof schemaImport>;

  constructor(db: PostgresJsDatabase<typeof schemaImport>) {
    this.db = db;
  }

  public handleCascading(): boolean {
    return true;
  }

  // Helper to fetch neighbors for a given parent ID
  private async fetchNeighbors(parentId: number): Promise<MapItemWithId[]> {
    const neighborResults = await this.db
      .select()
      .from(mapItems)
      .leftJoin(baseItems, eq(mapItems.refItemId, baseItems.id))
      .where(eq(mapItems.parentId, parentId)); // Find items whose parentId matches

    // Map neighbor DB results to domain objects (without their own neighbors)
    return neighborResults
      .filter((r) => r.map_items && r.base_items)
      .map((r) => mapJoinedDbToDomain(r as DbMapItemWithBase /*, [] */)); // Pass empty neighbors for children initially
  }

  // Get an item by ID, joining with baseItems AND fetching neighbors
  async getOne(id: number): Promise<MapItemWithId> {
    const result = await this.db
      .select()
      .from(mapItems)
      .leftJoin(baseItems, eq(mapItems.refItemId, baseItems.id))
      .where(eq(mapItems.id, id))
      .limit(1);

    if (
      result.length === 0 ||
      !result[0]?.map_items ||
      !result[0]?.base_items
    ) {
      throw new Error(`MapItem with id ${id} not found or baseItem missing.`);
    }

    const mainItemData = result[0] as DbMapItemWithBase;

    // Fetch neighbors
    const neighbors = await this.fetchNeighbors(mainItemData.map_items.id);

    // Map the main item, including its neighbors
    return mapJoinedDbToDomain(mainItemData, neighbors);
  }

  // Get by Identifier, including neighbors
  async getOneByIdr({
    idr,
  }: {
    idr: MapItemIdr;
    limit?: number; // Limit/offset usually don't apply when fetching one by IDR
    offset?: number;
  }): Promise<MapItemWithId> {
    // Step 1: Determine the map item ID
    let mapItemId: number | undefined;

    if ("id" in idr) {
      // If ID is directly provided, use it
      mapItemId = idr.id;
    } else if ("attrs" in idr && idr.attrs.coords) {
      // Otherwise, fetch the ID using coordinates and mapId
      const { row, col, path } = idr.attrs.coords;
      const pathString = pathToString(path);

      const whereClauses: SQL[] = [
        eq(mapItems.row, row),
        eq(mapItems.col, col),
        eq(mapItems.path, pathString),
      ];
      if (idr.attrs.mapId !== undefined) {
        whereClauses.push(eq(mapItems.mapId, idr.attrs.mapId));
      }

      // Find the map item ID
      const mapItemResult = await this.db
        .select({ id: mapItems.id })
        .from(mapItems)
        .where(sql.join(whereClauses, sql` AND `))
        .limit(1);

      if (mapItemResult.length > 0 && mapItemResult[0]?.id !== undefined) {
        mapItemId = mapItemResult[0].id;
      }
    } else {
      throw new Error("Invalid MapItemIdr provided for getOneByIdr");
    }

    if (!mapItemId) {
      throw new Error(`MapItem with idr ${JSON.stringify(idr)} not found.`);
    }

    // Step 2: Fetch complete item using the ID
    const result = await this.db
      .select()
      .from(mapItems)
      .leftJoin(baseItems, eq(mapItems.refItemId, baseItems.id))
      .where(eq(mapItems.id, mapItemId))
      .limit(1);

    if (
      result.length === 0 ||
      !result[0]?.map_items ||
      !result[0]?.base_items
    ) {
      throw new Error(
        `MapItem with id ${mapItemId} not found or baseItem missing.`,
      );
    }

    const mainItemData = result[0] as DbMapItemWithBase;

    // Step 3: Fetch neighbors
    const neighbors = await this.fetchNeighbors(mainItemData.map_items.id);

    // Map the main item, including its neighbors
    return mapJoinedDbToDomain(mainItemData, neighbors);
  }

  // Get Many (with join and pagination)
  // TODO: Implement neighbor loading efficiently for getMany (potential N+1 problem)
  // Current implementation does NOT load neighbors for each item in the list.
  async getMany({
    limit = 50,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  }): Promise<MapItemWithId[]> {
    const results = await this.db
      .select()
      .from(mapItems)
      .leftJoin(baseItems, eq(mapItems.refItemId, baseItems.id))
      .orderBy(mapItems.id)
      .limit(limit)
      .offset(offset);

    return results
      .filter((r) => r.map_items && r.base_items)
      .map((r) => mapJoinedDbToDomain(r as DbMapItemWithBase /*, [] */)); // No neighbors loaded here
  }

  // Get Many by ONLY Numeric Identifiers
  // TODO: Implement neighbor loading efficiently for getManyByIdr
  // Current implementation does NOT load neighbors for each item in the list.
  async getManyByIdr({
    idrs,
    limit = 50,
    offset = 0,
  }: {
    idrs: MapItemIdr[];
    limit?: number;
    offset?: number;
  }): Promise<MapItemWithId[]> {
    const numericIds: number[] = [];
    // Filter only numeric IDs for now
    for (const idr of idrs) {
      if ("id" in idr) {
        numericIds.push(idr.id);
      } else {
        console.warn(
          "getManyByIdr currently only supports numeric IDs for direct fetching, complex Idr ignored:",
          idr,
        );
      }
    }

    if (numericIds.length === 0) {
      return [];
    }

    const results = await this.db
      .select()
      .from(mapItems)
      .leftJoin(baseItems, eq(mapItems.refItemId, baseItems.id))
      .where(inArray(mapItems.id, numericIds))
      .orderBy(mapItems.id)
      .limit(limit)
      .offset(offset);

    // Note: Neighbors are NOT loaded for these items.
    // A separate query/strategy would be needed to efficiently load neighbors for all items.
    return results
      .filter((r) => r.map_items && r.base_items)
      .map((r) => mapJoinedDbToDomain(r as DbMapItemWithBase /*, [] */));
  }

  // Create - Neighbors are not relevant at creation time from DB perspective
  async create({
    attrs,
  }: {
    attrs: Attrs;
    relatedItems: RelatedItems; // Still required by interface, but not used for DB insert
    relatedLists: RelatedLists; // Still required by interface, but not used for DB insert
  }): Promise<MapItemWithId> {
    const { row, col, path } = attrs.coords;
    const pathString = pathToString(path);

    const [newItem] = await this.db
      .insert(mapItems)
      .values({
        mapId: attrs.mapId,
        originId: attrs.originId,
        parentId: attrs.parentId,
        row: row,
        col: col,
        path: pathString,
        refItemType: attrs.ref.itemType,
        refItemId: attrs.ref.itemId,
      })
      .returning({ id: mapItems.id });

    if (!newItem) {
      throw new Error("Failed to create map item");
    }
    // Fetch the newly created item with its (empty) neighbors
    return this.getOne(newItem.id);
  }

  // Update via Aggregate - relies on getOne after update
  async update({
    aggregate,
    attrs,
  }: {
    aggregate: MapItemWithId;
    attrs: Partial<Attrs>;
  }): Promise<MapItemWithId> {
    return this.updateByIdr({ idr: { id: aggregate.id }, attrs });
  }

  // Update via Numeric Identifier - relies on getOne after update
  async updateByIdr({
    idr,
    attrs,
  }: {
    idr: MapItemIdr;
    attrs: Partial<Attrs>;
  }): Promise<MapItemWithId> {
    // Determine the ID from the identifier
    let id: number;

    if ("id" in idr) {
      // If ID is directly provided, use it
      id = idr.id;
    } else {
      // Otherwise, fetch the item first to get its ID
      const item = await this.getOneByIdr({ idr });
      id = item.id;
    }

    const updateData: Partial<typeof mapItems.$inferInsert> = {};
    // Map partial attrs to DB update data
    if (attrs.mapId !== undefined) updateData.mapId = attrs.mapId;
    if (attrs.originId !== undefined) updateData.originId = attrs.originId;
    if (attrs.parentId !== undefined) updateData.parentId = attrs.parentId;
    if (attrs.coords !== undefined) {
      updateData.row = attrs.coords.row;
      updateData.col = attrs.coords.col;
      updateData.path = pathToString(attrs.coords.path);
    }
    if (attrs.ref !== undefined) {
      updateData.refItemType = attrs.ref.itemType;
      updateData.refItemId = attrs.ref.itemId;
    }

    if (Object.keys(updateData).length === 0) {
      console.warn(`Update called for MapItem ${id} with no changes.`);
      // Fetch and return the current state if no actual update occurs
      return this.getOne(id);
    }

    const [updatedItem] = await this.db
      .update(mapItems)
      .set(updateData)
      .where(eq(mapItems.id, id))
      .returning({ id: mapItems.id });

    if (!updatedItem) {
      // This might happen if the item was deleted between fetch and update
      throw new Error(`MapItem with id ${id} not found for update.`);
    }
    // Fetch the updated item with its neighbors
    return this.getOne(updatedItem.id);
  }

  // --- Relation Updates --- (Stubs - Throw standard Error)
  // Neighbors are handled implicitly by fetching in getOne/getOneByIdr

  async updateRelatedItem<K extends keyof RelatedItems>(args: {
    aggregate: MapItemWithId;
    key: K;
    item: RelatedItems[K];
  }): Promise<MapItemWithId> {
    console.warn("updateRelatedItem args:", args);
    // If key is 'ref', 'parent', or 'origin', this might require updating
    // refItemId, parentId, originId respectively.
    // This logic should potentially be integrated into the main update methods.
    // For now, consider this a no-op or throw.
    throw new Error(
      `updateRelatedItem not implemented directly for key: ${String(args.key)}. Use main update methods.`,
    );
  }

  async updateRelatedItemByIdr<K extends keyof RelatedItems>(args: {
    idr: MapItemIdr;
    key: K;
    item: RelatedItems[K];
  }): Promise<MapItemWithId> {
    console.warn("updateRelatedItemByIdr args:", args);
    throw new Error(
      `updateRelatedItemByIdr not implemented directly for key: ${String(args.key)}. Use main update methods.`,
    );
  }

  async addToRelatedList<K extends keyof RelatedLists>(args: {
    aggregate: MapItemWithId;
    key: K;
    item: RelatedLists[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<MapItemWithId> {
    // Adding a neighbor means creating a new MapItem with the parentId set.
    // This method isn't the place for creation.
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly add to 'neighbors' list via update. Create a new MapItem with the correct parentId.",
      );
    }
    throw new Error(
      `addToRelatedList not implemented for key: ${String(args.key)}`,
    );
  }

  async addToRelatedListByIdr<K extends keyof RelatedLists>(args: {
    idr: MapItemIdr;
    key: K;
    item: RelatedLists[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<MapItemWithId> {
    console.warn("addToRelatedListByIdr args:", args);
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly add to 'neighbors' list via update. Create a new MapItem with the correct parentId.",
      );
    }
    throw new Error(
      `addToRelatedListByIdr not implemented for key: ${String(args.key)}`,
    );
  }

  async removeFromRelatedList<K extends keyof RelatedLists>(args: {
    aggregate: MapItemWithId;
    key: K;
    itemId: number;
  }): Promise<MapItemWithId> {
    // Removing a neighbor means deleting the corresponding MapItem or setting its parentId to null.
    // This method isn't the place for deletion or parent reassignment.
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly remove from 'neighbors' list via update. Delete the child MapItem or update its parentId.",
      );
    }
    throw new Error(
      `removeFromRelatedList not implemented for key: ${String(args.key)}`,
    );
  }

  async removeFromRelatedListByIdr<K extends keyof RelatedLists>(args: {
    idr: MapItemIdr;
    key: K;
    itemId: number;
  }): Promise<MapItemWithId> {
    console.warn("removeFromRelatedListByIdr args:", args);
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly remove from 'neighbors' list via update. Delete the child MapItem or update its parentId.",
      );
    }
    throw new Error(
      `removeFromRelatedListByIdr not implemented for key: ${String(args.key)}`,
    );
  }

  // --- Remove --- (Cascading behavior note)
  // Note: If parentId has a foreign key constraint with ON DELETE CASCADE,
  // removing a parent might automatically remove children (neighbors).
  // Otherwise, neighbors might become orphaned (parentId becomes null or invalid).
  // The current `remove` method only deletes the specified item.
  async remove(id: number): Promise<void> {
    const result = await this.db
      .delete(mapItems)
      .where(eq(mapItems.id, id))
      .returning({ id: mapItems.id });
    if (result.length === 0) {
      console.warn(
        `MapItem with id ${id} not found for removal, or already removed.`,
      );
    }
    // Does NOT automatically handle children/neighbors unless DB cascade is set.
  }

  async removeByIdr({ idr }: { idr: MapItemIdr }): Promise<void> {
    if (!("id" in idr)) {
      // Need to fetch the ID first if removing by complex IDR
      const itemToFetch = await this.getOneByIdr({ idr }); // Fetch with neighbors, though not strictly needed for removal
      if (!itemToFetch) {
        console.warn(
          `MapItem with idr ${JSON.stringify(idr)} not found for removal.`,
        );
        return;
      }
      await this.remove(itemToFetch.id);
    } else {
      await this.remove(idr.id);
    }
  }

  // Add to the repository class
  async getDescendantsByParent({
    mapId,
    parentPath,
    limit = 100,
    offset = 0,
  }: {
    mapId: number;
    parentPath: HexDirection[];
    limit?: number;
    offset?: number;
  }): Promise<MapItemWithId[]> {
    let whereClause: SQL;

    // Convert parent path to string for comparison
    const parentPathString = pathToString(parentPath);

    if (parentPath.length === 0) {
      // If parent is center (empty path), get all descendants
      // These will have a non-empty path (meaning they're not the center)
      whereClause = sql`${mapItems.mapId} = ${mapId} AND ${mapItems.path} <> ''`;
    } else {
      // For non-center parents, get items whose path starts with parent path + comma
      // This ensures we get all descendants (direct and indirect children)
      const likePattern = parentPathString + ",%";
      whereClause = sql`${mapItems.mapId} = ${mapId} AND ${mapItems.path} LIKE ${likePattern}`;
    }

    // Execute the query with the appropriate WHERE clause
    const results = await this.db
      .select()
      .from(mapItems)
      .leftJoin(baseItems, eq(mapItems.refItemId, baseItems.id))
      .where(whereClause)
      .orderBy(mapItems.id)
      .limit(limit)
      .offset(offset);

    // Filter and map the results to domain objects
    const filteredResults = results
      .filter((r) => r.map_items && r.base_items)
      .map((r) => mapJoinedDbToDomain(r as DbMapItemWithBase));

    return filteredResults;
  }
}
