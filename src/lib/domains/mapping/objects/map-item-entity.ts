import {
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";
import { HexCoordinate } from "~/lib/hex-coordinates";

export interface MapItemEntityAttributes extends GenericEntityData {
  itemId: number;
  itemType: "resource" | "event";
  coordinates: HexCoordinate;
}

export class MapItemEntity extends GenericEntity {
  readonly data: MapItemEntityAttributes;

  constructor(data: MapItemEntityAttributes) {
    super(data);
    this.data = data;
  }
}
