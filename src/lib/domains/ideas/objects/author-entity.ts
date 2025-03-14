import {
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";

/**
 * Author representation in the ideas domain.
 * Represents a YouTube channel author or content creator.
 */
export interface AuthorAttributes extends GenericEntityData {
  id: string; // YouTube channel ID
  name: string;
  imageUrl?: string;
  description?: string;
  subscriberCount?: number;
}

export class AuthorEntity extends GenericEntity {
  readonly data: AuthorAttributes;

  constructor(data: AuthorAttributes) {
    super(data);
    this.data = {
      ...data,
    };
  }

  public static validateId(id: string) {
    if (!id) {
      throw new Error("Author ID is required");
    }
  }

  public static validateName(name: string) {
    if (!name || name.length < 2) {
      throw new Error("Author name must be at least 2 characters long");
    }
  }
}
