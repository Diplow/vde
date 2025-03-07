import { EventEntity, EventAttributes } from "~/lib/domains/politics/entities";
import { EventRepository } from "~/lib/domains/politics/repositories";
import { GenericMemoryRepository } from "~/lib/infrastructure/common/generic-memory-repository";

/**
 * Implementation of EventRepository using the generic memory repository
 */
export class EventMemoryRepositoryGeneric implements EventRepository {
  private repository: GenericMemoryRepository<EventAttributes, EventEntity>;

  constructor() {
    this.repository = new GenericMemoryRepository<EventAttributes, EventEntity>(
      EventEntity,
    );
  }

  async getOne(eventId: number): Promise<EventEntity> {
    return await this.repository.getOne(eventId);
  }

  async getMany(limit?: number, offset?: number): Promise<EventEntity[]> {
    return await this.repository.getMany(limit, offset);
  }

  async create(
    title: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    authorId: number,
  ): Promise<EventEntity> {
    return await this.repository.create({
      title,
      description,
      startDate,
      endDate,
      authorId,
    });
  }

  async update(
    eventId: number,
    data: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EventEntity> {
    return await this.repository.update(eventId, data);
  }

  async remove(eventId: number): Promise<void> {
    await this.repository.remove(eventId);
  }

  reset(): void {
    this.repository.reset();
  }
}
