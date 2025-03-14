import type {
  ContentAggregate,
  AuthorEntity,
  OwnerEntity,
  EventEntity,
} from "~/lib/domains/ideas/objects";

const authorAdapter = (entity: AuthorEntity) => {
  return {
    id: String(entity.data.id),
    name: entity.data.name,
    imageUrl: entity.data.imageUrl,
    description: entity.data.description,
    subscriberCount: entity.data.subscriberCount,
  };
};

export type AuthorContract = ReturnType<typeof authorAdapter>;

const ownerAdapter = (entity: OwnerEntity) => {
  return {
    id: String(entity.data.id),
    name: entity.data.name,
  };
};

export type OwnerContract = ReturnType<typeof ownerAdapter>;

const eventAdapter = (entity: EventEntity) => {
  return {
    id: String(entity.data.id),
    title: entity.data.title,
    description: entity.data.description,
    date: entity.data.date.toISOString(),
    imageUrl: entity.data.imageUrl,
    location: entity.data.location,
    organizerId: entity.data.organizerId,
    sourceUrl: entity.data.sourceUrl,
    tags: entity.data.tags,
    createdAt: entity.data.createdAt.toISOString(),
    updatedAt: entity.data.updatedAt.toISOString(),
  };
};

export type EventContract = ReturnType<typeof eventAdapter>;

const contentAdapter = (entity: ContentAggregate) => {
  return {
    id: String(entity.data.id),
    title: entity.data.title,
    description: entity.data.description,
    youtubeVideoId: entity.data.youtubeVideoId,
    viewCount: entity.data.viewCount,
    author: authorAdapter(entity.author),
    owner: ownerAdapter(entity.owner),
    mentionedEvents: entity.mentionedEvents.map(eventAdapter),
    relatedContents: entity.relatedContents.map((content) => ({
      id: String(content.data.id),
      title: content.data.title,
    })),
    createdAt: entity.data.createdAt.toISOString(),
    updatedAt: entity.data.updatedAt.toISOString(),
  };
};

export type ContentContract = ReturnType<typeof contentAdapter>;

export const adapters = {
  author: authorAdapter,
  owner: ownerAdapter,
  event: eventAdapter,
  content: contentAdapter,
};
