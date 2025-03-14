import {
  ContentAggregate,
  AuthorEntity,
  OwnerAttributes,
  EventEntity,
} from "~/lib/domains/ideas/objects";

export interface ContentRepository {
  getOne(contentId: number): Promise<ContentAggregate>;
  getMany(limit?: number, offset?: number): Promise<ContentAggregate[]>;
  getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<ContentAggregate[]>;
  getByAuthorId(
    authorId: string,
    limit?: number,
    offset?: number,
  ): Promise<ContentAggregate[]>;
  create(
    title: string,
    description: string | null,
    youtubeVideoId: string,
    viewCount: number,
    author: AuthorEntity,
    owner: OwnerAttributes,
    mentionedEvents?: EventEntity[],
  ): Promise<ContentAggregate>;
  update(
    contentId: number,
    data: {
      title?: string;
      description?: string | null;
      youtubeVideoId?: string;
      viewCount?: number;
    },
  ): Promise<ContentAggregate>;
  addMentionedEvent(contentId: number, event: EventEntity): Promise<void>;
  removeMentionedEvent(contentId: number, eventId: number): Promise<void>;
  remove(contentId: number): Promise<void>;
}
