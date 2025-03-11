import {
  GenericAggregate,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";
import { OwnerEntity } from "./owner-entity";
import { MapItemEntity } from "./map-item-entity";

export interface MapAttributes extends GenericEntityData {
  id: number;
  name: string;
  description: string | null;
  rows: number;
  columns: number;
  baseSize: number;
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

  public static validateName(name: string) {
    if (!name || name.length < 3) {
      throw new Error("Invalid map name: must be at least 3 characters long");
    }
  }
}
