import type { ContentRepository } from "~/lib/domains/ideas/repositories";
import { ContentActions } from "~/lib/domains/ideas/actions";
import {
  adapters,
  ContentContract,
  AuthorContract,
  EventContract,
} from "~/lib/domains/ideas/services/adapters";
import {
  ContentAggregate,
  AuthorEntity,
  EventEntity,
} from "~/lib/domains/ideas/objects";

export class ContentService {
  private readonly actions: ContentActions;

  constructor(private readonly repository: ContentRepository) {
    this.actions = new ContentActions(repository);
  }

  public async getOne(contentId: string): Promise<ContentContract> {
    const numericId = ContentService.validateAndParseId(contentId);
    return adapters.content(await this.actions.getOne(numericId));
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<ContentContract[]> {
    const params = ContentService.validatePaginationParameters(limit, offset);
    const contents = await this.actions.getMany(params.limit, params.offset);
    return contents.map(adapters.content);
  }

  public async getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<ContentContract[]> {
    const params = ContentService.validatePaginationParameters(limit, offset);
    const contents = await this.actions.getByOwnerId(
      ownerId,
      params.limit,
      params.offset,
    );
    return contents.map(adapters.content);
  }

  public async getByAuthorId(
    authorId: string,
    limit?: number,
    offset?: number,
  ): Promise<ContentContract[]> {
    const params = ContentService.validatePaginationParameters(limit, offset);
    const contents = await this.actions.getByAuthorId(
      authorId,
      params.limit,
      params.offset,
    );
    return contents.map(adapters.content);
  }

  public async create(
    title: string,
    description: string | null,
    youtubeVideoId: string,
    viewCount: number,
    author: {
      id: string;
      name: string;
      imageUrl?: string;
      description?: string;
      subscriberCount?: number;
    },
    ownerId: string,
    ownerName: string,
    mentionedEventIds: number[] = [],
  ): Promise<ContentContract> {
    // Validate input parameters
    ContentAggregate.validateTitle(title);
    ContentAggregate.validateYoutubeVideoId(youtubeVideoId);
    AuthorEntity.validateId(author.id);
    AuthorEntity.validateName(author.name);

    // Convert primitive types to domain objects
    const authorEntity = new AuthorEntity(author);

    // For each mentioned event ID, we would fetch the event entity
    // In a real implementation, we would inject the EventRepository
    // and fetch the events, but for simplicity we'll just use empty events
    const mentionedEvents: EventEntity[] = [];

    // Create the content
    const content = await this.actions.create(
      title,
      description,
      youtubeVideoId,
      viewCount,
      authorEntity,
      { id: ownerId, name: ownerName },
      mentionedEvents,
    );

    return adapters.content(content);
  }

  public async update(
    contentId: string,
    data: {
      title?: string;
      description?: string | null;
      youtubeVideoId?: string;
      viewCount?: number;
    },
  ): Promise<ContentContract> {
    // Validate update data
    ContentService.validateUpdateDataIsNotEmpty(data);

    if (data.title) {
      ContentAggregate.validateTitle(data.title);
    }

    if (data.youtubeVideoId) {
      ContentAggregate.validateYoutubeVideoId(data.youtubeVideoId);
    }

    // Perform the update
    const numericId = ContentService.validateAndParseId(contentId);
    return adapters.content(await this.actions.update(numericId, data));
  }

  public async addMentionedEvent(
    contentId: string,
    event: EventContract,
  ): Promise<void> {
    const numericContentId = ContentService.validateAndParseId(contentId);

    // Convert primitive event data to domain entity
    const eventEntity = new EventEntity({
      id: parseInt(event.id),
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      imageUrl: event.imageUrl,
      location: event.location,
      organizerId: event.organizerId,
      sourceUrl: event.sourceUrl,
      tags: event.tags,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    });

    await this.actions.addMentionedEvent(numericContentId, eventEntity);
  }

  public async removeMentionedEvent(
    contentId: string,
    eventId: string,
  ): Promise<void> {
    const numericContentId = ContentService.validateAndParseId(contentId);
    const numericEventId = ContentService.validateAndParseId(eventId);

    await this.actions.removeMentionedEvent(numericContentId, numericEventId);
  }

  public async remove(contentId: string): Promise<void> {
    const numericId = ContentService.validateAndParseId(contentId);
    await this.actions.remove(numericId);
  }

  /**
   * Validates and parses a string ID to a number
   */
  private static validateAndParseId(id: string): number {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error("Invalid ID: must be a positive number");
    }
    return numericId;
  }

  /**
   * Validates pagination parameters
   */
  private static validatePaginationParameters(limit?: number, offset?: number) {
    return {
      limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
      offset: offset && offset >= 0 ? offset : 0,
    };
  }

  /**
   * Ensures that the update data contains at least one field to update
   */
  private static validateUpdateDataIsNotEmpty(data: {
    title?: string;
    description?: string | null;
    youtubeVideoId?: string;
    viewCount?: number;
  }) {
    if (
      !data.title &&
      data.description === undefined &&
      !data.youtubeVideoId &&
      data.viewCount === undefined
    ) {
      throw new Error("No update data provided");
    }
  }
}
