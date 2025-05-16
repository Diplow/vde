import {
  type MapItemAttrs,
  type MapItemIdr,
  type MapItemRelatedItems,
  type MapItemRelatedLists,
  type MapItemWithId,
} from "~/lib/domains/mapping/_objects";
import { GenericRepository } from "../../utils/generic-repository";
import { HexCoord } from "../utils/hex-coordinates";

export interface MapItemRepository
  extends GenericRepository<
    MapItemAttrs,
    MapItemRelatedItems,
    MapItemRelatedLists,
    MapItemWithId,
    MapItemIdr
  > {
  /**
   * Get all descendants of a parent map item (direct and indirect children).
   *
   * @param mapId The map ID to filter by
   * @param parentPath The parent's coordinate path that children paths must start with
   * @param parentId Optional parent ID for alternative filtering (not used for descendants)
   * @param limit Optional limit for pagination
   * @param offset Optional offset for pagination
   * @returns Array of map items that are descendants of the specified parent
   */
  getDescendantsByParent({
    mapId,
    parentPath,
    limit,
    offset,
  }: {
    mapId: number;
    parentPath: HexCoord["path"];
    limit?: number;
    offset?: number;
  }): Promise<MapItemWithId[]>;
}
