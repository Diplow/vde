import {
  GenericAggregate,
  GenericAggregateConstructorArgs,
} from "~/lib/domains/utils/generic-objects";
import { type MapItemWithId } from "./map-item";
import { HEXMAP_RADIUS, HEX_SIZE } from "../types/constants";
import { HexDirection } from "../utils/hex-coordinates";
import { MAPPING_ERRORS } from "../types/errors";

export type HexSize = keyof typeof HEX_SIZE;
export type HexMapDepth = 0 | 1 | 2 | 3 | 4 | 5;

export const CENTER_COLOR = "zinc" as const satisfies "zinc";

export type HexColor =
  | "zinc"
  | "amber"
  | "emerald"
  | "cyan"
  | "indigo"
  | "fuchsia"
  | "rose";

export const DEPTH_TINTS = {
  0: "100",
  1: "300",
  2: "500",
  3: "700",
  4: "900",
  5: "950",
} as const;

export type HexColorTint = keyof typeof DEPTH_TINTS;

export const DEFAULT_HEXMAP_COLORS: Record<HexDirection, HexColor> = {
  [HexDirection.Center]: "zinc",
  [HexDirection.NorthWest]: "amber",
  [HexDirection.NorthEast]: "emerald",
  [HexDirection.East]: "cyan",
  [HexDirection.SouthEast]: "indigo",
  [HexDirection.SouthWest]: "fuchsia",
  [HexDirection.West]: "rose",
} as const;

export enum HexMapRadius {
  XS = 1,
  S = 3,
  M = 9,
  L = 27,
  XL = 81,
}
export const DEPTH_TO_RADIUS: Record<HexMapDepth, HexMapRadius> = {
  0: HexMapRadius.XS,
  1: HexMapRadius.XS,
  2: HexMapRadius.S,
  3: HexMapRadius.M,
  4: HexMapRadius.L,
  5: HexMapRadius.XL,
} as const;

export type HexMapColors = typeof DEFAULT_HEXMAP_COLORS;

export interface Attrs {
  centerId: number;
  ownerId: number;
  colors: HexMapColors;
  radius: HexMapRadius;
}

export type ShallNotUpdate = {
  centerId?: undefined;
  ownerId?: undefined;
};

export interface RelatedItems {
  center: MapItemWithId | null;
}

export interface RelatedLists {
  items: MapItemWithId[];
}

export interface MapConstructorArgs
  extends GenericAggregateConstructorArgs<
    Partial<Attrs> & { ownerId: number; centerId: number },
    Partial<RelatedItems> & { center: MapItemWithId | null },
    Partial<RelatedLists>
  > {
  items: MapItemWithId[];
  center: MapItemWithId | null;
}

export type HexMapIdr =
  | {
      id: number;
    }
  | {
      attrs: {
        centerId: number;
      };
    }
  | {
      relatedItems: {
        center: MapItemWithId;
      };
    }
  | {
      attrs: {
        name: string;
        ownerId: number;
      };
    };

export class HexMap extends GenericAggregate<
  Attrs,
  RelatedItems,
  RelatedLists
> {
  readonly center: MapItemWithId;
  readonly items: MapItemWithId[];

  constructor(args: MapConstructorArgs) {
    const { items, attrs, ...rest } = args;
    const center = items.find(
      (item) =>
        item.attrs.coords.row === 0 &&
        item.attrs.coords.col === 0 &&
        item.attrs.coords.path.length === 0,
    )!;
    if (!center?.id) {
      throw new Error(MAPPING_ERRORS.INVALID_MAP_CENTER);
    }
    if (!attrs?.ownerId) {
      throw new Error(MAPPING_ERRORS.MAP_OWNER_ID_REQUIRED);
    }
    super({
      ...rest,
      attrs: {
        ...attrs,
        colors: attrs?.colors ?? DEFAULT_HEXMAP_COLORS,
        centerId: center.id,
        ownerId: attrs?.ownerId ?? 0,
        radius: attrs?.radius ?? HexMapRadius.XS,
      },
      relatedLists: { items },
      relatedItems: { center },
    });
    this.items = items;
    this.center = center;

    HexMap.validate(this);
  }

  public static validate(map: HexMap) {
    HexMap.validateCenter(map.center);
  }

  public static validateDepth(depth: number) {
    if (depth < 0 || depth > 5) {
      throw new Error(MAPPING_ERRORS.INVALID_MAP_DEPTH);
    }
  }

  public static validateCenter(center: MapItemWithId) {
    if (center.attrs.coords.path.length !== 0) {
      throw new Error(MAPPING_ERRORS.INVALID_MAP_CENTER);
    }
  }

  public static minimumRadius(item: MapItemWithId) {
    const depth = item.attrs.coords.path.length;
    return DEPTH_TO_RADIUS[depth as HexMapDepth];
  }
}

export type MapWithId = HexMap & { id: number };
