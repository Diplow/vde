import { off } from "process";
import { EventEntity } from "~/lib/domains/politics/entities";
import { EventRepository } from "~/lib/domains/politics/repositories";

export const EventActions = (repository: EventRepository) => {
  const getOne = async (id: number): Promise<EventEntity> => {
    return repository.getOne(id);
  };

  const getMany = async (
    limit?: number,
    offset?: number,
  ): Promise<EventEntity[]> => {
    return repository.getMany(limit, offset);
  };

  const create = async (
    title: string,
    description: string | null,
    startDate: Date,
    endDate: Date,
    authorId: number,
  ): Promise<EventEntity> => {
    EventEntity.validateTitle(title);
    EventEntity.validateStartDate(startDate);
    EventEntity.validateEndDate(endDate);
    EventEntity.validateDateRange(startDate, endDate);

    return repository.create(
      title.trim(),
      description ? description.trim() : null,
      startDate,
      endDate,
      authorId,
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
  ): Promise<EventEntity> => {
    data.title && EventEntity.validateTitle(data.title);
    data.startDate && EventEntity.validateStartDate(data.startDate);
    data.endDate && EventEntity.validateEndDate(data.endDate);
    await validateNewEventDates(
      eventId,
      repository,
      data.startDate,
      data.endDate,
    );
    return repository.update(eventId, EventEntity.cleanData(data));
  };

  const remove = async (eventId: number): Promise<void> => {
    await repository.remove(eventId);
  };

  return {
    getOne,
    getMany,
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
  EventEntity.validateEndDateAfterStartDate(startDate, endDate);
};
