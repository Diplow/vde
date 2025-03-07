export interface EventAttributes {
  id: number;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export class EventEntity {
  public data: EventAttributes;

  constructor(data: EventAttributes) {
    this.data = data;
  }
  public static validateTitle = (title: string) => {
    if (!title || title.trim() === "") {
      throw new Error("Events must have a title.");
    }
  };

  public static validateStartDate = (startDate: Date) => {
    if (
      !startDate ||
      !(startDate instanceof Date) ||
      isNaN(startDate.getTime())
    ) {
      throw new Error("Valid start date is required");
    }
  };

  public static validateEndDate = (endDate: Date) => {
    if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error("Valid end date is required");
    }
  };

  public static validateDateRange = (startDate: Date, endDate: Date) => {
    if (startDate >= endDate) {
      throw new Error("End date must be after start date");
    }
  };

  public static validateEndDateAfterStartDate = (
    startDate: Date,
    endDate: Date,
  ) => {
    if (startDate >= endDate) {
      throw new Error("End date must be after start date");
    }
  };

  public static cleanData = (data: Partial<EventAttributes>) => {
    return {
      ...data,
      title: data.title?.trim(),
      description: data.description === null ? null : data.description?.trim(),
    };
  };
}
