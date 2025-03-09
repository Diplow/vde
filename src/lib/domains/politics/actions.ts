import {
  EventAggregate,
  AuthorEntityAttributes,
} from "~/lib/domains/politics/entities";
import { EventRepository } from "~/lib/domains/politics/repositories";

export const EventActions = (repository: EventRepository) => {
  const getOne = async (id: number): Promise<EventAggregate> => {
    return repository.getOne(id);
  };

  const getMany = async (
    limit?: number,
    offset?: number,
  ): Promise<EventAggregate[]> => {
    return repository.getMany(limit, offset);
  };

  const getByAuthorId = async (
    authorId: number,
    limit?: number,
    offset?: number,
  ): Promise<EventAggregate[]> => {
    return repository.getByAuthorId(authorId, limit, offset);
  };

  const create = async (
    title: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    author: AuthorEntityAttributes,
  ): Promise<EventAggregate> => {
    EventAggregate.validateTitle(title);
    EventAggregate.validateStartDate(startDate);
    EventAggregate.validateEndDate(endDate);
    EventAggregate.validateDateRange(startDate, endDate);

    return repository.create(
      title.trim(),
      description ? description.trim() : null,
      startDate,
      endDate,
      author,
    );
  };

  const update = async (
    eventId: number,
    data: {
      title?: string;
      description?: string | null;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EventAggregate> => {
    data.title && EventAggregate.validateTitle(data.title);
    data.startDate && EventAggregate.validateStartDate(data.startDate);
    data.endDate && EventAggregate.validateEndDate(data.endDate);
    await validateNewEventDates(
      eventId,
      repository,
      data.startDate,
      data.endDate,
    );
    return repository.update(eventId, EventAggregate.cleanData(data));
  };

  const remove = async (eventId: number): Promise<void> => {
    await repository.remove(eventId);
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

const validateNewEventDates = async (
  eventId: number,
  repository: EventRepository,
  newStartDate?: Date,
  newEndDate?: Date,
) => {
  if (!newStartDate && !newEndDate) return;
  const currentEvent = await repository.getOne(eventId);
  const startDate = newStartDate || currentEvent.data.startDate;
  const endDate = newEndDate || currentEvent.data.endDate;
  EventAggregate.validateEndDateAfterStartDate(startDate, endDate);
};
