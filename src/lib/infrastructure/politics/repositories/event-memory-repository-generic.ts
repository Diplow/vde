import {
  EventAggregate,
  EventAttributes,
  AuthorEntity,
  AuthorEntityAttributes,
} from "~/lib/domains/politics/objects";
import { EventRepository } from "~/lib/domains/politics/repositories";
import { GenericAggregateMemoryRepository } from "~/lib/infrastructure/common/generic-memory-repository";
import { GenericAggregate } from "~/lib/domains/utils/generic-objects";
import { AuthorEntity as AuthorEntityObject } from "~/lib/domains/politics/objects";

/**
 * Implementation of EventRepository using the generic memory repository
 */
export class EventMemoryRepositoryGeneric implements EventRepository {
  private repository: GenericAggregateMemoryRepository<
    EventAttributes,
    EventAggregate
  >;

  constructor() {
    this.repository = new GenericAggregateMemoryRepository<
      EventAttributes,
      EventAggregate
    >(
      class extends EventAggregate {
        constructor(
          data: EventAttributes,
          relatedItems: Record<string, GenericAggregate>,
          relatedLists: Record<string, GenericAggregate[]>,
        ) {
          super(data, relatedItems.author as AuthorEntityObject);
        }
      },
    );
  }

  async getOne(eventId: number): Promise<EventAggregate> {
    return await this.repository.getOne(eventId);
  }

  async getMany(limit?: number, offset?: number): Promise<EventAggregate[]> {
    return await this.repository.getMany(limit, offset);
  }

  async getByAuthorId(
    authorId: string,
    limit?: number,
    offset?: number,
  ): Promise<EventAggregate[]> {
    return await this.repository.getByRelatedItem(
      "author",
      authorId,
      limit,
      offset,
    );
  }

  async create(
    title: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    author: AuthorEntityAttributes,
  ): Promise<EventAggregate> {
    return await this.repository.create(
      {
        title,
        description,
        startDate,
        endDate,
      },
      { author: new AuthorEntityObject(author) },
      {},
    );
  }

  async update(
    eventId: number,
    data: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EventAggregate> {
    return await this.repository.update(eventId, data);
  }

  async remove(eventId: number): Promise<void> {
    await this.repository.remove(eventId);
  }

  reset(): void {
    this.repository.reset();
  }
}
