import {
  GenericAggregate,
  GenericEntityData,
} from "~/lib/domains/utils/generic-objects";
import { AuthorEntity } from "./author-entity";
import { EventEntity } from "./event-entity";

// In the ideas domain, we need a minimal representation of the owner
export interface OwnerAttributes extends GenericEntityData {
  id: string; // ClerkId
  name: string;
}

export class OwnerEntity {
  readonly data: OwnerAttributes;

  constructor(data: OwnerAttributes) {
    this.data = data;
  }
}

export interface ContentAttributes extends GenericEntityData {
  id: number;
  title: string;
  description: string | null;
  youtubeVideoId: string;
  viewCount: number;
  authorId: string; // YouTube channel ID (foreign key in DB)
  ownerId: string; // VDE user ID who created the content
  createdAt: Date;
  updatedAt: Date;
}

export class ContentAggregate extends GenericAggregate {
  readonly data: ContentAttributes;
  readonly author: AuthorEntity; // YouTube channel (relatedItem)
  readonly owner: OwnerEntity; // VDE user who created the content (relatedItem)
  readonly mentionedEvents: EventEntity[]; // Events mentioned in content (relatedList)
  readonly relatedContents: ContentAggregate[]; // Other content related to this (relatedList)

  constructor(
    data: ContentAttributes,
    author: AuthorEntity,
    owner: OwnerEntity,
    mentionedEvents: EventEntity[] = [],
    relatedContents: ContentAggregate[] = [],
  ) {
    super(
      data,
      { author: author as any, owner: owner as any }, // relatedItems
      {
        mentionedEvents: mentionedEvents as any[],
        relatedContents,
      }, // relatedLists
    );

    this.data = {
      ...data,
      description: data.description ?? null,
    };

    this.author = author;
    this.owner = owner;
    this.mentionedEvents = mentionedEvents;
    this.relatedContents = relatedContents;
  }

  public static validateTitle(title: string) {
    if (!title || title.length < 3) {
      throw new Error(
        "Invalid content title: must be at least 3 characters long",
      );
    }
  }

  public static validateYoutubeVideoId(youtubeVideoId: string) {
    if (
      !youtubeVideoId ||
      (youtubeVideoId.length !== 11 && youtubeVideoId.length !== 12)
    ) {
      throw new Error(
        "Invalid YouTube video ID: must be 11 or 12 characters long",
      );
    }
  }
}
