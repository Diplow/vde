import type {
  BaseItemRepository,
  MapItemRepository,
} from "~/lib/domains/mapping/_repositories";
import { MapItemWithId, MapItemType } from "~/lib/domains/mapping/_objects";
import {
  HexCoord,
  CoordSystem,
  HexDirection,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import { MAPPING_ERRORS } from "../types/errors";

export class MapItemMovementHelpers {
  constructor(
    private readonly mapItems: MapItemRepository,
    private readonly baseItems: BaseItemRepository,
  ) {}

  async validateCoordsForMove(
    oldCoords: HexCoord,
    newCoords: HexCoord,
    getMapItem: (coords: HexCoord) => Promise<MapItemWithId>,
    getParent: (coords: HexCoord) => Promise<MapItemWithId | null>,
  ) {
    await this._validateUserItemConstraints(oldCoords, newCoords, getMapItem);
    await this._validateUserSpaceConstraints(oldCoords, newCoords);

    const sourceParent = await getParent(oldCoords);
    const targetParent = await getParent(newCoords);

    this._validateParentExistence(sourceParent, oldCoords);
    this._validateParentExistence(targetParent, newCoords);

    return { sourceParent, targetParent };
  }

  async moveItemToTemporaryLocation(
    targetItem: MapItemWithId,
    targetParent: MapItemWithId | null,
    move: (
      item: MapItemWithId,
      newCoords: HexCoord,
      newParent: MapItemWithId | null,
    ) => Promise<void>,
  ): Promise<HexCoord> {
    const tempCoords = this._generateTemporaryCoords(targetItem, targetParent);
    await move(targetItem, tempCoords, targetParent);
    return tempCoords;
  }

  async move(
    item: MapItemWithId,
    newCoords: HexCoord,
    newParent: MapItemWithId | null,
    getDescendants: (parentId: number) => Promise<MapItemWithId[]>,
  ) {
    const oldCoords = item.attrs.coords;
    const descendants = await getDescendants(item.id);

    await this._updateItemCoordinates(item, newCoords, newParent);
    await this._updateDescendantCoordinates(descendants, oldCoords, newCoords);
  }

  private async _validateUserItemConstraints(
    oldCoords: HexCoord,
    newCoords: HexCoord,
    getMapItem: (coords: HexCoord) => Promise<MapItemWithId>,
  ) {
    if (CoordSystem.isCenter(oldCoords) || CoordSystem.isCenter(newCoords)) {
      const item = await getMapItem(oldCoords);
      if (item.attrs.itemType === MapItemType.USER) {
        throw new Error(
          "Root USER items cannot be moved to become children, and their userId/groupId cannot change via move.",
        );
      }
    }
  }

  private async _validateUserSpaceConstraints(
    oldCoords: HexCoord,
    newCoords: HexCoord,
  ) {
    if (
      oldCoords.userId !== newCoords.userId ||
      oldCoords.groupId !== newCoords.groupId
    ) {
      throw new Error(
        "Moving items across different user/group spaces (userId/groupId) is not supported by this action.",
      );
    }
  }

  private _validateParentExistence(
    parent: MapItemWithId | null,
    coords: HexCoord,
  ) {
    if (!parent && coords.path.length > 0) {
      throw new Error(
        `${MAPPING_ERRORS.FAILED_PARENT_COORDS} for coordinates.`,
      );
    }
  }

  private _generateTemporaryCoords(
    targetItem: MapItemWithId,
    targetParent: MapItemWithId | null,
  ): HexCoord {
    const NON_EXISTING_DIRECTION = 7 as HexDirection;
    const tempPath = [
      ...(targetParent ? targetParent.attrs.coords.path : []),
      NON_EXISTING_DIRECTION,
    ];

    return {
      userId: targetItem.attrs.coords.userId,
      groupId: targetItem.attrs.coords.groupId,
      path: tempPath,
    };
  }

  private async _updateItemCoordinates(
    item: MapItemWithId,
    newCoords: HexCoord,
    newParent: MapItemWithId | null,
  ) {
    await this.mapItems.updateByIdr({
      idr: { id: item.id },
      attrs: {
        coords: newCoords,
        parentId: newParent?.id ?? null,
      },
    });
  }

  private async _updateDescendantCoordinates(
    descendants: MapItemWithId[],
    oldCoords: HexCoord,
    newCoords: HexCoord,
  ) {
    const sortedDescendants = descendants.sort(
      (a, b) => a.attrs.coords.path.length - b.attrs.coords.path.length,
    );

    for (const descendant of sortedDescendants) {
      const pathSuffix = descendant.attrs.coords.path.slice(
        oldCoords.path.length,
      );
      const newDescendantCoords: HexCoord = {
        userId: newCoords.userId,
        groupId: newCoords.groupId,
        path: [...newCoords.path, ...pathSuffix],
      };

      await this.mapItems.updateByIdr({
        idr: { id: descendant.id },
        attrs: { coords: newDescendantCoords },
      });
    }
  }
}
