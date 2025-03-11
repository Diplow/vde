import {
  EventAggregate,
  AuthorEntityAttributes,
} from "~/lib/domains/politics/objects";
import { EventRepository } from "~/lib/domains/politics/repositories";

export class EventActions {
  private readonly repository: EventRepository;

  constructor(repository: EventRepository) {
    this.repository = repository;
  }

  public async getOne(id: number): Promise<EventAggregate> {
    return this.repository.getOne(id);
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<EventAggregate[]> {
    return this.repository.getMany(limit, offset);
  }

  public async getByAuthorId(
    authorId: string,
    limit?: number,
    offset?: number,
  ): Promise<EventAggregate[]> {
    return this.repository.getByAuthorId(authorId, limit, offset);
  }

  public async create(
    title: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    author: AuthorEntityAttributes,
  ): Promise<EventAggregate> {
    EventAggregate.validateTitle(title);
    EventAggregate.validateStartDate(startDate);
    EventAggregate.validateEndDate(endDate);
    EventAggregate.validateDateRange(startDate, endDate);

    return this.repository.create(
      title.trim(),
      description ? description.trim() : null,
      startDate,
      endDate,
      author,
    );
  }

  public async update(
    eventId: number,
    data: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EventAggregate> {
    data.title && EventAggregate.validateTitle(data.title);
    data.startDate && EventAggregate.validateStartDate(data.startDate);
    data.endDate && EventAggregate.validateEndDate(data.endDate);
    await this.validateNewEventDates(eventId, data.startDate, data.endDate);
    return this.repository.update(eventId, EventAggregate.cleanData(data));
  }

  public async remove(eventId: number): Promise<void> {
    await this.repository.remove(eventId);
  }

  private async validateNewEventDates(
    eventId: number,
    newStartDate?: Date,
    newEndDate?: Date,
  ) {
    if (!newStartDate && !newEndDate) return;
    const currentEvent = await this.repository.getOne(eventId);
    const startDate = newStartDate || currentEvent.data.startDate;
    const endDate = newEndDate || currentEvent.data.endDate;
    EventAggregate.validateEndDateAfterStartDate(startDate, endDate);
  }
}
