import { EventEntity } from "~/lib/domains/politics/entities";
import { EventRepository } from "~/lib/domains/politics/repositories";
import { EventActions } from "~/lib/domains/politics/actions";

export interface EventContract {
  id: string; // Note: Converting from number to string for the API
  title: string;
  description: string | null;
  startDate: string; // ISO format for API
  endDate: string; // ISO format for API
  authorId: string;
  createdAt: string; // ISO format for API
}

export const ServiceEvent = (repository: EventRepository) => {
  const actions = EventActions(repository);
  const adapt = (entity: EventEntity): EventContract => {
    return {
      id: String(entity.data.id),
      title: entity.data.title,
      description: entity.data.description,
      startDate: entity.data.startDate.toISOString(),
      endDate: entity.data.endDate.toISOString(),
      authorId: String(entity.data.authorId),
      createdAt: entity.data.createdAt.toISOString(),
    };
  };

  const getOne = async (id: string): Promise<EventContract> => {
    const event = await actions.getOne(validateAndParseId(id));
    return adapt(event);
  };

  const getMany = async (
    limit?: number,
    offset?: number,
  ): Promise<EventContract[]> => {
    const params = validatePaginationParameters(limit, offset);
    const events = await actions.getMany(params.limit, params.offset);

    if (!events || !Array.isArray(events)) {
      return [];
    }

    return await Promise.all(events.map(adapt));
  };

  const create = async (
    title: string,
    description: string | null,
    startDate: string,
    endDate: string,
    authorId: string,
  ): Promise<EventContract> => {
    const event = await actions.create(
      title,
      description,
      new Date(startDate),
      new Date(endDate),
      validateAndParseId(authorId),
    );

    return adapt(event);
  };

  const update = async (
    id: string,
    data: {
      title?: string;
      description?: string | null;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<EventContract> => {
    assertUpdateDataIsNotEmpty(data);
    const updateData: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    } = {
      title: data.title,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };
    const updatedEvent = await actions.update(
      validateAndParseId(id),
      updateData,
    );
    return adapt(updatedEvent);
  };

  const remove = async (id: string): Promise<void> => {
    await actions.remove(validateAndParseId(id));
  };

  return {
    getOne,
    getMany,
    create,
    update,
    remove,
  };
};

const validateAndParseId = (id: string) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new Error("Invalid ID: must be a positive number");
  }
  return numericId;
};

const validatePaginationParameters = (limit?: number, offset?: number) => {
  return {
    limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
    offset: offset && offset >= 0 ? offset : 0,
  };
};

const assertUpdateDataIsNotEmpty = (data: {
  title?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
}) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("No update data provided");
  }
};
