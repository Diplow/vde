import type { MapItemWithId } from "../_objects";
import { MapItemType } from "../_objects";
import { CoordSystem } from "../utils/hex-coordinates";

export const mapItemDomainToContractAdapter = (
  aggregate: MapItemWithId,
  ownerId: number,
) => {
  return {
    id: String(aggregate.id),
    ownerId: String(ownerId),
    coords: CoordSystem.createId(aggregate.attrs.coords),
    name: aggregate.ref.attrs.title,
    descr: aggregate.ref.attrs.descr,
    url: aggregate.ref.attrs.link,
    itemType: aggregate.attrs.itemType,
    depth: aggregate.attrs.coords.path.length,
    parentId: aggregate.attrs.parentId
      ? String(aggregate.attrs.parentId)
      : null,
  };
};

export type MapItemContract = ReturnType<typeof mapItemDomainToContractAdapter>;
export { MapItemType };

export interface MoveMapItemResult {
  modifiedItems: MapItemContract[];
  movedItemId: string;
  affectedCount: number;
}

/**
 * Adapts a root USER MapItem and its descendants to a MapContract.
 * MapContract represents a view of a single "map" tree.
 */
export const mapDomainToContractAdapter = (
  rootItem: MapItemWithId,
  descendants: MapItemWithId[],
) => {
  if (rootItem.id === undefined) {
    throw new Error("Cannot adapt map root item without an ID");
  }
  if (rootItem.attrs.itemType !== MapItemType.USER) {
    throw new Error(
      "MapContract can only be created from a USER type root MapItem.",
    );
  }

  const baseRef = rootItem.ref;
  const allItems = [rootItem, ...descendants];

  return {
    id: rootItem.id,
    coords: rootItem.attrs.coords,
    title: baseRef.attrs.title,
    descr: baseRef.attrs.descr,
    itemType: rootItem.attrs.itemType,
    userId: rootItem.attrs.coords.userId,
    groupId: rootItem.attrs.coords.groupId,
    itemCount: allItems.length,
    items: allItems.map((item) =>
      mapItemDomainToContractAdapter(item, item.attrs.coords.userId),
    ),
  };
};

export type MapContract = ReturnType<typeof mapDomainToContractAdapter>;

export const adapt = {
  map: mapDomainToContractAdapter,
  mapItem: mapItemDomainToContractAdapter,
};
