import { HexCoordinate } from "~/lib/hex-coordinates";
import {
  GenericAggregate,
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/entities";

export interface OwnerEntityAttributes extends GenericEntityData {
  id: number;
}

export class OwnerEntity extends GenericEntity {
  readonly data: OwnerEntityAttributes;

  constructor(data: OwnerEntityAttributes) {
    super(data);
    this.data = data;
  }
}

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

export interface MapAttributes extends GenericEntityData {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MapAggregate extends GenericAggregate {
  readonly data: MapAttributes;
  readonly owner: OwnerEntity;
  readonly items: MapItemEntity[];

  constructor(
    data: MapAttributes,
    owner: OwnerEntity,
    items: MapItemEntity[] = [],
  ) {
    super(data, { owner }, { items });
    this.data = {
      ...data,
      description: data.description ?? null,
    };
    this.owner = owner;
    this.items = items;
  }
}
