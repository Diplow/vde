import type {
  EventAggregate,
  AuthorEntityAttributes,
} from "~/lib/domains/politics/entities";

export interface EventRepository {
  getOne(eventId: number): Promise<EventAggregate>;
  getMany(limit?: number, offset?: number): Promise<EventAggregate[]>;
  getByAuthorId(
    authorId: number,
    limit?: number,
    offset?: number,
  ): Promise<EventAggregate[]>;
  create(
    title: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    author: AuthorEntityAttributes,
  ): Promise<EventAggregate>;
  update(
    eventId: number,
    data: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EventAggregate>;
  remove(eventId: number): Promise<void>;
}
