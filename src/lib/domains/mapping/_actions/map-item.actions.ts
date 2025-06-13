import type {
  BaseItemRepository,
  MapItemRepository,
} from "~/lib/domains/mapping/_repositories";
import {
  type BaseItemAttrs,
  type BaseItemWithId,
  type MapItemWithId,
  MapItemType,
} from "~/lib/domains/mapping/_objects";
import { type Coord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { MapItemIdr } from "../_repositories/map-item";
import { MapItemCreationHelpers } from "./_map-item-creation-helpers";
import { MapItemQueryHelpers } from "./_map-item-query-helpers";
import { MapItemMovementHelpers } from "./_map-item-movement-helpers";

export class MapItemActions {
  public readonly mapItems: MapItemRepository;
  private readonly baseItems: BaseItemRepository;
  private readonly creationHelpers: MapItemCreationHelpers;
  private readonly queryHelpers: MapItemQueryHelpers;
  private readonly movementHelpers: MapItemMovementHelpers;

  constructor(repositories: {
    mapItem: MapItemRepository;
    baseItem: BaseItemRepository;
  }) {
    this.mapItems = repositories.mapItem;
    this.baseItems = repositories.baseItem;
    this.creationHelpers = new MapItemCreationHelpers(
      repositories.mapItem,
      repositories.baseItem,
    );
    this.queryHelpers = new MapItemQueryHelpers(
      repositories.mapItem,
      repositories.baseItem,
    );
    this.movementHelpers = new MapItemMovementHelpers(
      repositories.mapItem,
      repositories.baseItem,
    );
  }

  public async createMapItem({
    itemType,
    coords,
    title,
    descr,
    url,
    parentId,
  }: {
    itemType: MapItemType;
    coords: Coord;
    title?: string;
    descr?: string;
    url?: string;
    parentId?: number;
  }): Promise<MapItemWithId> {
    return await this.creationHelpers.createMapItem({
      itemType,
      coords,
      title,
      descr,
      url,
      parentId,
    });
  }

  public async updateRef(ref: BaseItemWithId, attrs: Partial<BaseItemAttrs>) {
    return await this.creationHelpers.updateRef(ref, attrs);
  }

  public async removeItem({ idr }: { idr: MapItemIdr }) {
    const { item, descendants } = await this._getItemAndDescendants(idr);
    await this._removeDescendantsAndItem(descendants, item.id);
  }

  public async getMapItem({
    coords,
  }: {
    coords: Coord;
  }): Promise<MapItemWithId> {
    return await this.queryHelpers.getMapItem({ coords });
  }

  public async moveMapItem({
    oldCoords,
    newCoords,
  }: {
    oldCoords: Coord;
    newCoords: Coord;
  }) {
    const sourceItem = await this.getMapItem({ coords: oldCoords });
    this._validateUserItemMove(sourceItem, newCoords);
    this._validateUserSpaceMove(sourceItem, newCoords);

    const { sourceParent, targetParent } =
      await this.movementHelpers.validateCoordsForMove(
        oldCoords,
        newCoords,
        (coords) => this.getMapItem({ coords }),
        (coords) => this.queryHelpers.getParent(coords),
      );

    const targetItem = await this._getTargetItem(newCoords);
    const tempCoordsHoldingTarget = await this._handleTargetItemDisplacement(
      targetItem,
      sourceParent,
      oldCoords,
    );

    await this._moveSourceItem(sourceItem, newCoords, targetParent);
    await this._restoreDisplacedItem(
      targetItem,
      tempCoordsHoldingTarget,
      oldCoords,
      sourceParent,
    );

    return this.mapItems.getOne(sourceItem.id);
  }

  public async getDescendants(parentId: number): Promise<MapItemWithId[]> {
    return await this.queryHelpers.getDescendants(parentId);
  }

  private async _getItemAndDescendants(idr: MapItemIdr) {
    let item: MapItemWithId | null = null;

    if ("id" in idr) {
      item = await this.mapItems.getOne(idr.id);
    } else if (idr.attrs?.coords) {
      item = await this.mapItems.getOneByIdr({ idr });
    } else {
      throw new Error("Invalid identifier for removeItem");
    }

    if (!item) {
      throw new Error(
        `MapItem not found with provided identifier: ${JSON.stringify(idr)}`,
      );
    }

    const descendants = await this.getDescendants(item.id);
    return { item, descendants };
  }

  private async _removeDescendantsAndItem(
    descendants: MapItemWithId[],
    itemId: number,
  ) {
    for (const descendant of descendants.reverse()) {
      await this.mapItems.remove(descendant.id);
    }
    await this.mapItems.remove(itemId);
  }

  private _validateUserItemMove(item: MapItemWithId, newCoords: Coord) {
    if (item.attrs.itemType === MapItemType.USER && newCoords.path.length > 0) {
      throw new Error(
        "USER (root) items cannot be moved to become child items.",
      );
    }
  }

  private _validateUserSpaceMove(item: MapItemWithId, newCoords: Coord) {
    if (
      item.attrs.itemType === MapItemType.USER &&
      (item.attrs.coords.userId !== newCoords.userId ||
        item.attrs.coords.groupId !== newCoords.groupId)
    ) {
      throw new Error(
        "USER (root) items cannot change their userId or groupId through a move operation.",
      );
    }

    if (
      item.attrs.coords.userId !== newCoords.userId ||
      item.attrs.coords.groupId !== newCoords.groupId
    ) {
      throw new Error("Cannot move item to a different userId/groupId space.");
    }
  }

  private async _getTargetItem(newCoords: Coord) {
    return await this.mapItems
      .getOneByIdr({ idr: { attrs: { coords: newCoords } } })
      .catch(() => null);
  }

  private async _handleTargetItemDisplacement(
    targetItem: MapItemWithId | null,
    sourceParent: MapItemWithId | null,
    oldCoords: Coord,
  ) {
    if (!targetItem) return null;

    if (
      targetItem.attrs.itemType === MapItemType.USER &&
      oldCoords.path.length > 0
    ) {
      throw new Error("Cannot displace a USER (root) item with a child item.");
    }

    return await this.movementHelpers.moveItemToTemporaryLocation(
      targetItem,
      sourceParent,
      (item, coords, parent) =>
        this.movementHelpers.move(item, coords, parent, (parentId) =>
          this.getDescendants(parentId),
        ),
    );
  }

  private async _moveSourceItem(
    sourceItem: MapItemWithId,
    newCoords: Coord,
    targetParent: MapItemWithId | null,
  ) {
    await this.movementHelpers.move(
      sourceItem,
      newCoords,
      targetParent,
      (parentId) => this.getDescendants(parentId),
    );
  }

  private async _restoreDisplacedItem(
    targetItem: MapItemWithId | null,
    tempCoordsHoldingTarget: Coord | null,
    oldCoords: Coord,
    sourceParent: MapItemWithId | null,
  ) {
    if (targetItem && tempCoordsHoldingTarget) {
      await this.movementHelpers.move(
        targetItem,
        oldCoords,
        sourceParent,
        (parentId) => this.getDescendants(parentId),
      );
    }
  }
}
