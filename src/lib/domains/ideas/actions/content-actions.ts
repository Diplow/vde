import type { ContentRepository } from "~/lib/domains/ideas/repositories";
import type {
  ContentAggregate,
  OwnerAttributes,
  AuthorEntity,
  EventEntity,
} from "~/lib/domains/ideas/objects";

export class ContentActions {
  private readonly repository: ContentRepository;

  constructor(repository: ContentRepository) {
    this.repository = repository;
  }

  public async getOne(contentId: number): Promise<ContentAggregate> {
    return await this.repository.getOne(contentId);
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<ContentAggregate[]> {
    return await this.repository.getMany(limit, offset);
  }

  public async getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<ContentAggregate[]> {
    return await this.repository.getByOwnerId(ownerId, limit, offset);
  }

  public async getByAuthorId(
    authorId: string,
    limit?: number,
    offset?: number,
  ): Promise<ContentAggregate[]> {
    return await this.repository.getByAuthorId(authorId, limit, offset);
  }

  public async create(
    title: string,
    description: string | null,
    youtubeVideoId: string,
    viewCount: number,
    author: AuthorEntity,
    owner: OwnerAttributes,
    mentionedEvents: EventEntity[] = [],
  ): Promise<ContentAggregate> {
    return await this.repository.create(
      title,
      description,
      youtubeVideoId,
      viewCount,
      author,
      owner,
      mentionedEvents,
    );
  }

  public async update(
    contentId: number,
    data: {
      title?: string;
      description?: string | null;
      youtubeVideoId?: string;
      viewCount?: number;
    },
  ): Promise<ContentAggregate> {
    // Ensure there's at least one field to update
    if (
      !data.title &&
      data.description === undefined &&
      !data.youtubeVideoId &&
      data.viewCount === undefined
    ) {
      throw new Error("No update data provided");
    }

    return await this.repository.update(contentId, data);
  }

  public async addMentionedEvent(
    contentId: number,
    event: EventEntity,
  ): Promise<void> {
    await this.repository.addMentionedEvent(contentId, event);
  }

  public async removeMentionedEvent(
    contentId: number,
    eventId: number,
  ): Promise<void> {
    await this.repository.removeMentionedEvent(contentId, eventId);
  }

  public async remove(contentId: number): Promise<void> {
    await this.repository.remove(contentId);
  }
}
