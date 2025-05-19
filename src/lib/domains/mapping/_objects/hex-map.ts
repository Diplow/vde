import {
  GenericAggregate,
  GenericAggregateConstructorArgs,
} from "~/lib/domains/utils/generic-objects";
import { type MapItemWithId } from "./map-item";
import { HEX_SIZE } from "../types/constants";
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

export type HexMapColors = typeof DEFAULT_HEXMAP_COLORS;

export type HexMapRequiredAttributes = Pick<Attrs, "centerId" | "ownerId">;

const defaultAttributes = {
  title: "Untitled Map",
};

export interface Attrs {
  title?: string;
  centerId: number;
  ownerId: string;
}

export interface CreateAttrs {
  title?: string;
  centerId: number;
  ownerId: string;
}

export interface UpdateAttrs {
  title?: string;
}

export interface RelatedItems {
  center: MapItemWithId | null;
}

export interface RelatedLists {
  items: MapItemWithId[];
}

export interface MapConstructorArgs
  extends GenericAggregateConstructorArgs<Attrs, RelatedItems, RelatedLists> {
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
        ownerId: string;
      };
    };

export class HexMap extends GenericAggregate<
  Attrs,
  RelatedItems,
  RelatedLists
> {
  readonly objectName = "HexMap";

  get createdAt(): Date {
    return this.history.createdAt;
  }
  get updatedAt(): Date {
    return this.history.updatedAt;
  }

  get title(): string {
    return this.attrs.title ?? defaultAttributes.title;
  }
  get centerId(): number {
    return this.attrs.centerId;
  }
  get ownerId(): string {
    const oid = this.attrs.ownerId;
    if (typeof oid !== "string" || oid.trim() === "") {
      throw new Error(
        "HexMap.ownerId getter: ownerId is unexpectedly not a valid string post-construction.",
      );
    }
    return oid;
  }

  get center(): MapItemWithId | null {
    return this.relatedItems.center;
  }
  get items(): MapItemWithId[] {
    return this.relatedLists.items;
  }

  constructor(args: MapConstructorArgs) {
    const { items, center, attrs: inputAttrs, id, history } = args;

    if (!center?.id) {
      throw new Error(MAPPING_ERRORS.INVALID_MAP_CENTER);
    }

    const ownerIdFromInput = inputAttrs?.ownerId;
    if (typeof ownerIdFromInput !== "string" || !ownerIdFromInput.trim()) {
      throw new Error(MAPPING_ERRORS.MAP_OWNER_ID_REQUIRED);
    }

    const finalAttrs: Attrs = {
      title: inputAttrs?.title ?? defaultAttributes.title,
      centerId: center.id,
      ownerId: ownerIdFromInput,
    };

    super({
      id,
      history,
      attrs: finalAttrs,
      relatedItems: { center },
      relatedLists: { items },
    });

    HexMap.validate(this);
  }

  public static validate(map: HexMap) {
    if (map.center) {
      HexMap.validateCenter(map.center);
    } else {
      throw new Error(MAPPING_ERRORS.INVALID_MAP_CENTER);
    }
  }

  public static validateDepth(depth: number) {
    if (depth < 0 || depth > 5) {
      throw new Error(MAPPING_ERRORS.INVALID_MAP_DEPTH);
    }
  }

  public static validateCenter(centerItem: MapItemWithId) {
    if (centerItem.attrs.coords.path.length !== 0) {
      throw new Error(MAPPING_ERRORS.INVALID_MAP_CENTER);
    }
  }
}

export type MapWithId = HexMap & { readonly id: number };
