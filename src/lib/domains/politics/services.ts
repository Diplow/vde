import { EventRepository } from "~/lib/domains/politics/repositories";
import { EventActions } from "~/lib/domains/politics/actions";
import { adapters, EventContract } from "~/lib/domains/politics/adapters";

export const ServiceEvent = (repository: EventRepository) => {
  const actions = EventActions(repository);

  const getOne = async (id: string): Promise<EventContract> => {
    const event = await actions.getOne(validateAndParseId(id));
    return adapters.event(event);
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

    return events.map(adapters.event);
  };

  const getByAuthorId = async (
    authorId: string,
    limit?: number,
    offset?: number,
  ): Promise<EventContract[]> => {
    const params = validatePaginationParameters(limit, offset);
    const events = await actions.getByAuthorId(
      validateAndParseId(authorId),
      params.limit,
      params.offset,
    );

    if (!events || !Array.isArray(events)) {
      return [];
    }

    return events.map(adapters.event);
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
      { id: validateAndParseId(authorId) },
    );

    return adapters.event(event);
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

    const updatedEvent = await actions.update(
      validateAndParseId(id),
      updateData,
    );
    return adapters.event(updatedEvent);
  };

  const remove = async (id: string): Promise<void> => {
    await actions.remove(validateAndParseId(id));
  };

  return {
    getOne,
    getMany,
    getByAuthorId,
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
