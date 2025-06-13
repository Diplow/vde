import type {
  MapItemRepository,
  BaseItemRepository,
} from "~/lib/domains/mapping/_repositories";
import { MapItemActions } from "~/lib/domains/mapping/_actions";
import { adapt } from "~/lib/domains/mapping/types/contracts";
import type { Coord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { MapItemContract } from "../types/contracts";

export class ItemQueryService {
  private readonly actions: MapItemActions;

  constructor(repositories: {
    mapItem: MapItemRepository;
    baseItem: BaseItemRepository;
  }) {
    this.actions = new MapItemActions({
      mapItem: repositories.mapItem,
      baseItem: repositories.baseItem,
    });
  }

  /**
   * Get all items for a specific map (root + descendants)
   */
  async getItems({
    userId,
    groupId = 0,
  }: {
    userId: number;
    groupId?: number;
  }): Promise<MapItemContract[]> {
    const rootItem = await this.actions.mapItems.getRootItem(userId, groupId);
    if (!rootItem) return [];
    const descendants = await this.actions.getDescendants(rootItem.id);
    const allItems = [rootItem, ...descendants];
    return allItems.map((item) =>
      adapt.mapItem(item, item.attrs.coords.userId),
    );
  }

  /**
   * Get all descendants of a specific item ID
   */
  async getDescendants({
    itemId,
  }: {
    itemId: number;
  }): Promise<MapItemContract[]> {
    const item = await this.actions.mapItems.getOne(itemId);
    if (!item) throw new Error(`Item with id ${itemId} not found.`);

    const descendants = await this.actions.getDescendants(itemId);
    return descendants.map((desc) =>
      adapt.mapItem(desc, desc.attrs.coords.userId),
    );
  }

  /**
   * Get a specific item by its ID
   */
  async getItemById({ itemId }: { itemId: number }): Promise<MapItemContract> {
    const item = await this.actions.mapItems.getOne(itemId);
    if (!item) throw new Error(`Item with id ${itemId} not found.`);
    return adapt.mapItem(item, item.attrs.coords.userId);
  }

  /**
   * Move an item to new coordinates
   */
  async moveMapItem({
    oldCoords,
    newCoords,
  }: {
    oldCoords: Coord;
    newCoords: Coord;
  }): Promise<MapItemContract> {
    const movedItem = await this.actions.moveMapItem({
      oldCoords,
      newCoords,
    });
    return adapt.mapItem(movedItem, movedItem.attrs.coords.userId);
  }
}
