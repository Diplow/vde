import {
  GenericAggregate,
  GenericAggregateConstructorArgs,
} from "~/lib/domains/utils/generic-objects";
import {
  HexCoord,
  HexCoordSystem,
  HexDirection,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import type { BaseItemWithId } from "./base-item";
import { MAPPING_ERRORS } from "../types/errors";

export enum MapItemType {
  BASE = "base",
  CONTENT = "content",
  EVENT = "event",
  RESOURCE = "resource",
  AUTHOR = "author",
}

export interface Attrs {
  mapId?: number | null;
  originId: number | null; // The original mapItem this is a copy of.
  parentId: number | null; // The parent mapItem this is a copy of.
  coords: HexCoord;
  ref: {
    itemType: MapItemType;
    itemId: number;
  };
}

export type ShallNotUpdate = {
  mapId?: undefined;
  parentId?: undefined;
  originId?: undefined;
};

export interface RelatedItems {
  ref: BaseItemWithId;
  parent: MapItemWithId | null;
  origin: MapItemWithId | null;
}
export interface RelatedLists {
  neighbors: MapItemWithId[];
}

export interface MapItemConstructorArgs
  extends GenericAggregateConstructorArgs<
    Partial<Attrs>,
    Partial<RelatedItems> & { ref: BaseItemWithId },
    Partial<RelatedLists>
  > {
  attrs: Partial<Attrs>;
  ref: BaseItemWithId;
  neighbors?: MapItemWithId[];
  parent?: MapItemWithId | null;
  origin?: MapItemWithId | null;
}

export type MapItemIdr =
  | { id: number }
  | {
      attrs: {
        coords: HexCoord;
        mapId: number;
      };
    };

export class MapItem extends GenericAggregate<
  Attrs,
  RelatedItems,
  RelatedLists
> {
  readonly neighbors: MapItem[];
  readonly ref: BaseItemWithId;
  readonly parent: MapItem | null;
  readonly origin: MapItem | null;

  constructor(args: MapItemConstructorArgs) {
    const {
      ref,
      neighbors = [],
      parent = null,
      origin = null,
      attrs,
      ...rest
    } = args;
    super({
      ...rest,
      attrs: {
        ...attrs,
        mapId: attrs.mapId ?? null,
        originId: attrs.originId ?? origin?.id ?? null,
        parentId: attrs.parentId ?? parent?.id ?? null,
        coords: attrs.coords ?? HexCoordSystem.getCenterCoord(),
        ref: attrs.ref ?? {
          itemType: MapItemType.BASE,
          itemId: ref.id,
        },
      },
      relatedLists: { neighbors },
      relatedItems: { ref, parent, origin },
    });

    this.neighbors = neighbors;
    this.ref = ref;
    this.parent = parent;
    this.origin = origin;

    MapItem.validate(this);
  }

  public static validate(item: MapItem) {
    MapItem.validateCoords(item);
    MapItem.validateParent(item);
  }

  public static validateCoords(item: MapItem) {
    if (item.attrs.coords.row !== 0 || item.attrs.coords.col !== 0) {
      throw new Error(MAPPING_ERRORS.MUST_GRAVITATE_AROUND_CENTER);
    }
    // if (item.attrs.coords.path.length > 5) {
    //   throw new Error(
    //     "MapItems should not be deeper than 5 levels from the center.",
    //   );
    // }
  }

  public static validateParent(item: MapItem) {
    if (item.parent) {
      const parentDepth = item.parent.attrs.coords.path.length;
      const itemDepth = item.attrs.coords.path.length;
      if (itemDepth !== parentDepth + 1) {
        throw new Error(MAPPING_ERRORS.INVALID_PARENT_LEVEL);
      }
    }
  }

  public static validateNeighbors(item: MapItem) {
    MapItem.validateNeighborsCount(item);
    MapItem.validateNeighborDirections(item);
  }

  private static validateNeighborsCount(item: MapItem) {
    const neighbors = item.neighbors;
    if (neighbors.length > 6) {
      throw new Error(MAPPING_ERRORS.INVALID_NEIGHBORS_COUNT);
    }
  }

  private static validateNeighborDirections(item: MapItem) {
    MapItem.checkNeighborsDepth(item);
    MapItem.checkNeighborsPath(item);
    const occupiedDirections = new Set<HexDirection>();
    for (const neighbor of item.neighbors) {
      const direction = neighbor.attrs.coords.path[
        neighbor.attrs.coords.path.length - 1
      ] as HexDirection;
      if (occupiedDirections.has(direction)) {
        throw new Error(
          "Invalid neighbor: must have a unique direction from parent",
        );
      }
      occupiedDirections.add(direction);
    }
  }

  public static isCenter(item: MapItem) {
    return item.parent === null;
  }

  private static checkNeighborsDepth(item: MapItem) {
    const neighbors = item.neighbors;
    for (const neighbor of neighbors) {
      const parentDepth = item.attrs.coords.path.length;
      const itemDepth = neighbor.attrs.coords.path.length;
      if (itemDepth !== parentDepth + 1) {
        throw new Error("Invalid parent: must be one level deeper");
      }
    }
  }

  private static checkNeighborsPath(item: MapItem) {
    const neighbors = item.neighbors;
    const itemPath = item.attrs.coords.path;

    for (const neighbor of neighbors) {
      const neighborPath = neighbor.attrs.coords.path;
      // A neighbor's path should be exactly one element longer than the item's path
      // and should contain the item's path as a prefix
      if (
        neighborPath.length !== itemPath.length + 1 ||
        !itemPath.every((dir, i) => dir === neighborPath[i])
      ) {
        throw new Error(MAPPING_ERRORS.INVALID_NEIGHBOR_PATH);
      }
    }
  }
}

export type MapItemWithId = MapItem & { id: number };
