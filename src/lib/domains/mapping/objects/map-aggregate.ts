import {
  GenericAggregate,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";
import { OwnerEntity } from "./owner-entity";
import { MapItemAggregate } from "./map-item-aggregate";

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
  readonly items: MapItemAggregate[];

  constructor(
    data: MapAttributes,
    owner: OwnerEntity,
    items: MapItemAggregate[] = [],
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

  public static validateDimensions(dimensions: {
    rows?: number;
    columns?: number;
    baseSize?: number;
  }) {
    // Check if at least one dimension is provided
    if (
      dimensions.rows === undefined &&
      dimensions.columns === undefined &&
      dimensions.baseSize === undefined
    ) {
      throw new Error("At least one dimension must be provided");
    }

    // Validate each provided dimension
    if (dimensions.rows !== undefined && dimensions.rows <= 0) {
      throw new Error("Rows must be a positive number");
    }
    if (dimensions.columns !== undefined && dimensions.columns <= 0) {
      throw new Error("Columns must be a positive number");
    }
    if (dimensions.baseSize !== undefined && dimensions.baseSize <= 0) {
      throw new Error("Base size must be a positive number");
    }
  }
}
