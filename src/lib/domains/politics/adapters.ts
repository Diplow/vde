import type { EventAggregate, AuthorEntity } from "./objects";

const authorAdapter = (entity: AuthorEntity) => {
  return {
    id: String(entity.data.id),
  };
};

export type AuthorContract = ReturnType<typeof authorAdapter>;

const eventAdapter = (entity: EventAggregate) => {
  return {
    id: String(entity.data.id),
    title: entity.data.title,
    description: entity.data.description,
    startDate: entity.data.startDate.toISOString(),
    endDate: entity.data.endDate.toISOString(),
    author: authorAdapter(entity.author),
    createdAt: entity.data.createdAt.toISOString(),
    updatedAt: entity.data.updatedAt.toISOString(),
  };
};

export type EventContract = ReturnType<typeof eventAdapter>;

export const adapters = {
  author: authorAdapter,
  event: eventAdapter,
};
