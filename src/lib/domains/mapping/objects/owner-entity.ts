import {
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";

/**
 * Minimal owner representation for the mapping domain.
 * Represents a VDE user who owns content items on the map.
 */
export interface OwnerAttributes extends GenericEntityData {
  id: string;
}

export class OwnerEntity extends GenericEntity {
  readonly data: OwnerAttributes;

  constructor(data: OwnerAttributes) {
    super(data);
    this.data = {
      ...data,
    };
  }

  public static validateId(id: string) {
    if (!id) {
      throw new Error("Owner ID is required");
    }
  }

  public static validateName(name: string) {
    if (!name || name.trim().length === 0) {
      throw new Error("Owner name is required");
    }
  }
}
