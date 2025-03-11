import {
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";

export interface AuthorEntityAttributes extends GenericEntityData {
  id: string;
}

export class AuthorEntity extends GenericEntity {
  readonly data: AuthorEntityAttributes;

  constructor(data: AuthorEntityAttributes) {
    super(data);
    this.data = data;
  }
}
