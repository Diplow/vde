import {
  ContentAggregate,
  AuthorEntity,
  OwnerEntity,
  EventEntity,
  OwnerAttributes,
} from "~/lib/domains/ideas/objects";
import { ContentRepository } from "~/lib/domains/ideas/repositories";
import { GenericAggregate } from "~/lib/domains/utils/generic-objects";

export class ContentMemoryRepository implements ContentRepository {
  private contents: ContentAggregate[] = [];
  private nextId = 1;

  async getOne(contentId: number): Promise<ContentAggregate> {
    const content = this.contents.find((c) => c.data.id === contentId);
    if (!content) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    return content;
  }

  async getMany(limit = 50, offset = 0): Promise<ContentAggregate[]> {
    return this.contents.slice(offset, offset + limit);
  }

  async getByOwnerId(
    ownerId: string,
    limit = 50,
    offset = 0,
  ): Promise<ContentAggregate[]> {
    return this.contents
      .filter((content) => content.owner.data.id === ownerId)
      .slice(offset, offset + limit);
  }

  async getByAuthorId(
    authorId: string,
    limit = 50,
    offset = 0,
  ): Promise<ContentAggregate[]> {
    return this.contents
      .filter((content) => content.author.data.id === authorId)
      .slice(offset, offset + limit);
  }

  async create(
    title: string,
    description: string | null,
    youtubeVideoId: string,
    viewCount: number,
    author: AuthorEntity,
    owner: OwnerAttributes,
    mentionedEvents: EventEntity[] = [],
  ): Promise<ContentAggregate> {
    const id = this.nextId++;
    const content = new ContentAggregate(
      {
        id,
        title,
        description,
        youtubeVideoId,
        viewCount,
        authorId: author.data.id,
        ownerId: owner.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      author,
      new OwnerEntity(owner),
      mentionedEvents,
      [],
    );
    this.contents.push(content);
    return content;
  }

  async update(
    contentId: number,
    data: {
      title?: string;
      description?: string | null;
      youtubeVideoId?: string;
      viewCount?: number;
    },
  ): Promise<ContentAggregate> {
    const contentIndex = this.contents.findIndex(
      (c) => c.data.id === contentId,
    );
    if (contentIndex === -1) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const content = this.contents[contentIndex];
    if (!content) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const updatedData = {
      ...content.data,
      ...data,
      updatedAt: new Date(),
    };

    const updatedContent = new ContentAggregate(
      updatedData,
      content.author,
      content.owner,
      content.mentionedEvents,
      content.relatedContents,
    );

    this.contents[contentIndex] = updatedContent;
    return updatedContent;
  }

  async addMentionedEvent(
    contentId: number,
    event: EventEntity,
  ): Promise<void> {
    const contentIndex = this.contents.findIndex(
      (c) => c.data.id === contentId,
    );
    if (contentIndex === -1) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const content = this.contents[contentIndex];
    if (!content) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const mentionedEvents = [...content.mentionedEvents, event];

    this.contents[contentIndex] = new ContentAggregate(
      content.data,
      content.author,
      content.owner,
      mentionedEvents,
      content.relatedContents,
    );
  }

  async removeMentionedEvent(
    contentId: number,
    eventId: number,
  ): Promise<void> {
    const contentIndex = this.contents.findIndex(
      (c) => c.data.id === contentId,
    );
    if (contentIndex === -1) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const content = this.contents[contentIndex];
    if (!content) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const mentionedEvents = content.mentionedEvents.filter(
      (e) => e.data.id !== eventId,
    );

    this.contents[contentIndex] = new ContentAggregate(
      content.data,
      content.author,
      content.owner,
      mentionedEvents,
      content.relatedContents,
    );
  }

  async remove(contentId: number): Promise<void> {
    const contentIndex = this.contents.findIndex(
      (c) => c.data.id === contentId,
    );
    if (contentIndex === -1) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    this.contents.splice(contentIndex, 1);
  }

  reset(): void {
    this.contents = [];
    this.nextId = 1;
  }
}
