import type {
  BaseItemRepository,
  MapItemRepository,
  MapRepository,
} from "~/lib/domains/mapping/_repositories";
import {
  BaseItem,
  BaseItemAttrs,
  BaseItemWithId,
  HexMap,
  MapItem,
  MapItemAttrs,
  MapItemIdr,
  MapItemWithId,
  type MapAttrs,
} from "~/lib/domains/mapping/_objects";
import {
  HexCoord,
  HexCoordSystem,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import { HexMapIdr, MapWithId, HexColor } from "../_objects/hex-map";
import { ShallNotUpdate as MapItemShallNotUpdate } from "../_objects/map-item";
import { MAPPING_ERRORS } from "../types/errors";

export class MapActions {
  private readonly maps: MapRepository;
  private readonly mapItems: MapItemRepository;
  private readonly baseItems: BaseItemRepository;

  constructor(repositories: {
    map: MapRepository;
    mapItem: MapItemRepository;
    baseItem: BaseItemRepository;
  }) {
    this.maps = repositories.map;
    this.mapItems = repositories.mapItem;
    this.baseItems = repositories.baseItem;
  }

  public async createMapItem({
    title,
    descr,
    url,
    coords = HexCoordSystem.getCenterCoord(),
    mapId,
  }: {
    title?: string;
    descr?: string;
    url?: string;
    coords?: HexCoord;
    mapId?: number;
  }) {
    const parent = await this.getParent(coords, mapId);
    const mapItem = this.instantiateNewMapItem({
      mapId,
      coords,
      ref: await this.createRef(title, descr, url),
      parent,
    });
    const newMapItem = await this.mapItems.create(mapItem);
    return newMapItem;
  }

  private instantiateNewMapItem(args: {
    mapId?: number;
    coords: HexCoord;
    ref: BaseItemWithId;
    parent: MapItemWithId | null;
  }) {
    const { mapId, coords, ref, parent } = args;
    return new MapItem({
      attrs: {
        mapId,
        coords,
      },
      ref,
      neighbors: [],
      parent,
    });
  }

  public async get(mapId: number) {
    return this.maps.getOne(mapId);
  }

  public async getMany(args: { limit?: number; offset?: number }) {
    const { limit, offset } = args;
    return this.maps.getMany({
      limit: limit ?? 50,
      offset: offset ?? 0,
    });
  }

  public async getByOwnerId(args: {
    ownerId: string;
    limit?: number;
    offset?: number;
  }) {
    const { ownerId, limit, offset } = args;
    return this.maps.getByOwnerId({
      ownerId,
      limit: limit ?? 50,
      offset: offset ?? 0,
    });
  }

  public async create(args: {
    center: MapItemWithId;
    attrs?: Partial<MapAttrs> & { ownerId: string };
  }) {
    const { center, attrs } = args;

    if (
      !attrs?.ownerId ||
      typeof attrs.ownerId !== "string" ||
      !attrs.ownerId.trim()
    ) {
      throw new Error("ownerId is required and must be a non-empty string");
    }

    const map = await this.maps.create({
      relatedItems: {
        center,
      },
      relatedLists: {
        items: [center],
      },
      attrs: {
        ...attrs,
        centerId: center.id,
      },
    });
    return map;
  }

  public async update(args: { idr: HexMapIdr; attrs: Partial<MapAttrs> }) {
    const { idr, attrs } = args;
    return await this.maps.updateByIdr({
      idr,
      attrs,
    });
  }

  public async updateRef(ref: BaseItemWithId, attrs: Partial<BaseItemAttrs>) {
    return await this.baseItems.update({
      aggregate: ref,
      attrs,
    });
  }

  public async remove({ mapId }: { mapId: number }) {
    await this.maps.removeByIdr({
      idr: {
        id: mapId,
      },
    });
  }

  public async addItem({ mapItem }: { mapItem: MapItemWithId }) {
    this.assertItemIsNotCenter(mapItem);
    const map = await this.maps.getOne(mapItem.attrs.mapId as number);
    return await this.addItemToMap(map, mapItem);
  }

  public async removeItem(args: { idr: MapItemIdr }) {
    let itemId = undefined;
    if ("id" in args.idr) {
      itemId = args.idr.id;
    } else {
      const item = await this.mapItems.getOneByIdr(args);
      itemId = item.id;
    }
    const descendants = await this.getDescendants(itemId);
    for (const descendant of descendants) {
      await this.mapItems.remove(descendant.id);
    }
    await this.mapItems.remove(itemId);
  }

  public async getItems({ mapId }: { mapId: number }) {
    const map = await this.maps.getOne(mapId);
    return map.items;
  }

  public async getMapItem({
    mapId,
    coords,
  }: {
    mapId: number;
    coords: HexCoord;
  }): Promise<MapItemWithId> {
    try {
      return await this.mapItems.getOneByIdr({
        idr: {
          attrs: {
            mapId,
            coords,
          },
        },
      });
    } catch (error) {
      throw new Error(MAPPING_ERRORS.ITEM_NOT_FOUND);
    }
  }

  private async getMapItemOrNull({
    mapId,
    coords,
  }: {
    mapId: number;
    coords: HexCoord;
  }): Promise<MapItemWithId | null> {
    try {
      return await this.mapItems.getOneByIdr({
        idr: {
          attrs: {
            mapId,
            coords,
          },
        },
      });
    } catch (error) {
      if ((error as Error).message.includes("not found")) {
        return null;
      }
      throw error;
    }
  }

  public async updateItem(args: {
    idr: MapItemIdr;
    attrs: Partial<MapItemAttrs> & MapItemShallNotUpdate;
  }) {
    const { idr, attrs } = args;
    return this.mapItems.updateByIdr({
      idr,
      attrs,
    });
  }

  private async validateCoordsForMove(
    oldCoords: HexCoord,
    newCoords: HexCoord,
    mapId: number,
  ) {
    if (
      HexCoordSystem.isCenter(oldCoords) ||
      HexCoordSystem.isCenter(newCoords)
    ) {
      throw new Error(MAPPING_ERRORS.CENTER_ITEM_NOT_ALLOWED);
    }

    const sourceParent = await this.getParent(oldCoords, mapId);
    const targetParent = await this.getParent(newCoords, mapId);

    if (!sourceParent || !targetParent) {
      throw new Error(MAPPING_ERRORS.FAILED_PARENT_COORDS);
    }

    return { sourceParent, targetParent };
  }

  private async moveItemToTemporaryLocation(
    targetItem: MapItemWithId,
    targetParent: MapItemWithId,
  ): Promise<HexCoord> {
    const NON_EXISTING_DIRECTION = 7;
    const tempCoords = {
      row: 0,
      col: 0,
      path: [...targetItem.attrs.coords.path, NON_EXISTING_DIRECTION],
    };
    await this.move(targetItem, tempCoords, targetParent);

    return tempCoords;
  }

  public async moveMapItem({
    mapId,
    oldCoords,
    newCoords,
  }: {
    mapId: number;
    oldCoords: HexCoord;
    newCoords: HexCoord;
  }) {
    const { sourceParent, targetParent } = await this.validateCoordsForMove(
      oldCoords,
      newCoords,
      mapId,
    );

    const sourceItem = await this.getMapItem({ mapId, coords: oldCoords });
    const targetItem = await this.getMapItemOrNull({
      mapId,
      coords: newCoords,
    });

    const tempCoords = targetItem
      ? await this.moveItemToTemporaryLocation(targetItem, targetParent)
      : null;

    await this.move(sourceItem, newCoords, targetParent);

    if (tempCoords) {
      await this.move(targetItem as MapItemWithId, oldCoords, sourceParent);
    }

    return this.maps.getOne(mapId);
  }

  /**
   * Helper method to get all descendants of a map item
   */
  public async getDescendants(parentId: number): Promise<MapItemWithId[]> {
    try {
      // First get the parent item to know its mapId and path
      const parent = await this.mapItems.getOne(parentId);

      // Use the specialized repository method for better performance
      const descendants = await this.mapItems.getDescendantsByParent({
        mapId: parent.attrs.mapId as number,
        parentPath: parent.attrs.coords.path,
      });

      return descendants;
    } catch (error) {
      console.error(`Failed to get descendants for parent ${parentId}:`, error);
      return [];
    }
  }

  /**
   * Moves a map item to a new position and updates all of its descendants.
   * This ensures that the entire subtree maintains consistent coordinates.
   */
  private async move(
    item: MapItemWithId,
    newCoords: HexCoord,
    parent: MapItemWithId,
  ) {
    // Get all descendants BEFORE we update the parent's coordinates
    const oldCoords = item.attrs.coords;
    const descendants = await this.getDescendants(item.id);

    // Sort descendants by path length (shortest first) to ensure parents are updated before children
    descendants.sort(
      (a, b) => a.attrs.coords.path.length - b.attrs.coords.path.length,
    );

    // First update the parent item
    await this.mapItems.updateByIdr({
      idr: {
        id: item.id,
      },
      attrs: {
        coords: newCoords,
        parentId: parent.id,
      },
    });

    // Then update all descendants
    for (const descendant of descendants) {
      // Calculate how the path differs from the old parent path
      const pathSuffix = descendant.attrs.coords.path.slice(
        oldCoords.path.length,
      );

      // Create new coordinates by combining the new parent path with the path suffix
      const newDescendantCoords: HexCoord = {
        row: 0,
        col: 0,
        path: [...newCoords.path, ...pathSuffix],
      };

      // Update the descendant's coordinates
      await this.mapItems.updateByIdr({
        idr: { id: descendant.id },
        attrs: { coords: newDescendantCoords },
      });
    }
  }

  private createRef(title?: string, descr?: string, url?: string) {
    const baseItem = new BaseItem({ attrs: { title, descr, link: url } });
    return this.baseItems.create(baseItem);
  }

  private async getParent(coords: HexCoord, mapId?: number) {
    if (HexCoordSystem.isCenter(coords)) return null;
    const parentCoords = HexCoordSystem.getParentCoord(coords);
    if (!parentCoords) throw new Error(MAPPING_ERRORS.FAILED_PARENT_COORDS);
    try {
      return this.mapItems.getOneByIdr({
        idr: {
          attrs: {
            coords: parentCoords,
            mapId: mapId!,
          },
        },
      });
    } catch (error) {
      console.error(
        `Parent not found for coords ${JSON.stringify(coords)} in map ${mapId}`,
        error,
      );
      return null;
    }
  }

  private assertItemIsNotCenter(mapItem: MapItemWithId) {
    if (HexCoordSystem.isCenter(mapItem.attrs.coords)) {
      throw new Error(MAPPING_ERRORS.MAP_CENTER_ITEM);
    }
  }

  private async addItemToMap(map: MapWithId, item: MapItemWithId) {
    if (item.attrs.mapId !== map.id) {
      throw new Error(
        `Item with ID ${item.id} (mapId: ${item.attrs.mapId}) does not belong to map ${map.id}`,
      );
    }
    return await this.maps.addToRelatedList({
      aggregate: map,
      key: "items",
      item,
    });
  }
}
