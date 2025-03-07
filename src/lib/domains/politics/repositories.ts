import type { EventEntity } from "~/lib/domains/politics/entities";

export interface EventRepository {
  getOne(eventId: number): Promise<EventEntity>;
  getMany(limit?: number, offset?: number): Promise<EventEntity[]>;
  create(
    title: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    authorId: number,
  ): Promise<EventEntity>;
  update(
    eventId: number,
    data: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EventEntity>;
  remove(eventId: number): Promise<void>;
}
