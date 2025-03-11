import {
  GenericAggregate,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";
import { AuthorEntity } from "./author-entity";

export interface EventAttributes extends GenericEntityData {
  id: number;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EventAggregate extends GenericAggregate {
  readonly data: EventAttributes;
  readonly author: AuthorEntity;

  constructor(data: EventAttributes, author: AuthorEntity) {
    super(data, { author }, {});
    this.data = {
      ...data,
      description: data.description ?? null,
    };
    this.author = author;
  }

  public static validateTitle(title: string) {
    if (!title || title.trim() === "") {
      throw new Error("Events must have a title.");
    }
  }

  public static validateStartDate(startDate: Date) {
    if (
      !startDate ||
      !(startDate instanceof Date) ||
      isNaN(startDate.getTime())
    ) {
      throw new Error("Valid start date is required");
    }
  }

  public static validateEndDate(endDate: Date) {
    if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error("Valid end date is required");
    }
  }

  public static validateDateRange(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new Error("End date must be after start date");
    }
  }

  public static validateEndDateAfterStartDate(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new Error("End date must be after start date");
    }
  }

  public static cleanData(data: Partial<EventAttributes>) {
    return {
      ...data,
      title: data.title?.trim(),
      description: data.description === null ? null : data.description?.trim(),
    };
  }
}
