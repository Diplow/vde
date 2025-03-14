import {
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";

/**
 * Comprehensive event representation for the ideas domain.
 * Contains all relevant attributes for understanding an event.
 */
export interface EventAttributes extends GenericEntityData {
  id: number;
  title: string;
  description: string;
  date: Date;
  imageUrl?: string;
  location?: string;
  organizerId?: string;
  sourceUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class EventEntity extends GenericEntity {
  readonly data: EventAttributes;

  constructor(data: EventAttributes) {
    super(data);
    this.data = {
      ...data,
      description: data.description ?? "",
    };
  }

  public static validateId(id: number) {
    if (isNaN(id) || id <= 0) {
      throw new Error("Event ID must be a positive number");
    }
  }

  public static validateTitle(title: string) {
    if (!title || title.trim().length === 0) {
      throw new Error("Event title is required");
    }
  }

  public static validateDate(date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error("Event date must be a valid date");
    }
  }
}
