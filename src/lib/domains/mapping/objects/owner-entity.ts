import {
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";

export interface OwnerEntityAttributes extends GenericEntityData {
  id: string;
}

export class OwnerEntity extends GenericEntity {
  readonly data: OwnerEntityAttributes;

  constructor(data: OwnerEntityAttributes) {
    super(data);
    this.data = data;
  }
}
