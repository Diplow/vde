import {
  GenericAggregate,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";
import { HexCoordinate } from "~/lib/hex-coordinates";
import { OwnerEntity } from "./owner-entity";

/**
 * MapItem types representing different content types that can be placed on a map
 */
export enum MapItemType {
  CONTENT = "content",
  EVENT = "event",
  RESOURCE = "resource",
  AUTHOR = "author",
}

/**
 * Simple reference to the actual content in the ideas domain
 */
export interface MapItemReference {
  id: number | string; // ID of the referenced entity
  type: MapItemType; // Type of the referenced entity
}

/**
 * MapItemAggregate attributes
 */
export interface MapItemAttributes extends GenericEntityData {
  id: number;
  mapId: number;
  coordinates: HexCoordinate;
  reference: MapItemReference;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MapItemAggregate that focuses on spatial arrangement and related items.
 * This keeps the mapping domain focused on positioning and arrangement,
 * while delegating content details to the ideas domain.
 */
export class MapItemAggregate extends GenericAggregate {
  readonly data: MapItemAttributes;
  readonly owner: OwnerEntity; // User who placed this item (relatedItem)
  readonly relatedMapItems: MapItemAggregate[]; // Other map items related to this one (relatedList)

  constructor(
    data: MapItemAttributes,
    owner: OwnerEntity,
    relatedMapItems: MapItemAggregate[] = [],
  ) {
    super(
      data,
      { owner }, // relatedItems
      { relatedMapItems }, // relatedLists
    );

    this.data = {
      ...data,
    };

    this.owner = owner;
    this.relatedMapItems = relatedMapItems;
  }

  public static validateCoordinates(coordinates: HexCoordinate) {
    if (
      !coordinates ||
      coordinates.row === undefined ||
      coordinates.col === undefined
    ) {
      throw new Error("Map item coordinates are required");
    }
  }

  public static validateReference(reference: MapItemReference) {
    if (!reference || !reference.id || !reference.type) {
      throw new Error("Map item reference must include an ID and type");
    }

    if (!Object.values(MapItemType).includes(reference.type)) {
      throw new Error(`Invalid reference type: ${reference.type}`);
    }
  }
}
