import { EventRepository } from "~/lib/domains/politics/repositories";
import { EventActions } from "~/lib/domains/politics/actions";
import {
  adapters,
  EventContract,
} from "~/lib/domains/politics/services/adapters";

export class EventService {
  private readonly actions: EventActions;

  constructor(repository: EventRepository) {
    this.actions = new EventActions(repository);
  }

  public async getOne(id: string): Promise<EventContract> {
    const event = await this.actions.getOne(this.validateAndParseId(id));
    return adapters.event(event);
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<EventContract[]> {
    const params = this.validatePaginationParameters(limit, offset);
    const events = await this.actions.getMany(params.limit, params.offset);

    if (!events || !Array.isArray(events)) {
      return [];
    }

    return events.map(adapters.event);
  }

  public async getByAuthorId(
    authorId: string,
    limit?: number,
    offset?: number,
  ): Promise<EventContract[]> {
    const params = this.validatePaginationParameters(limit, offset);
    const events = await this.actions.getByAuthorId(
      authorId,
      params.limit,
      params.offset,
    );

    if (!events || !Array.isArray(events)) {
      return [];
    }

    return events.map(adapters.event);
  }

  public async create(
    title: string,
    description: string | null,
    startDate: string,
    endDate: string,
    authorId: string,
  ): Promise<EventContract> {
    const event = await this.actions.create(
      title,
      description,
      new Date(startDate),
      new Date(endDate),
      { id: authorId },
    );

    return adapters.event(event);
  }

  public async update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<EventContract> {
    this.assertUpdateDataIsNotEmpty(data);
    const updateData: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    const updatedEvent = await this.actions.update(
      this.validateAndParseId(id),
      updateData,
    );
    return adapters.event(updatedEvent);
  }

  public async remove(id: string): Promise<void> {
    await this.actions.remove(this.validateAndParseId(id));
  }

  private validateAndParseId(id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error("Invalid ID: must be a positive number");
    }
    return numericId;
  }

  private validatePaginationParameters(limit?: number, offset?: number) {
    return {
      limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
      offset: offset && offset >= 0 ? offset : 0,
    };
  }

  private assertUpdateDataIsNotEmpty(data: {
    title?: string;
    description?: string | null;
    startDate?: string;
    endDate?: string;
  }) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No update data provided");
    }
  }
}
