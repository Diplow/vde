import { describe, it, expect, beforeEach } from "vitest";
import { ContentService } from "~/lib/domains/ideas/services";
import { ContentMemoryRepository } from "~/lib/infrastructure/ideas/repositories/content-memory-repository";
import { AuthorEntity } from "~/lib/domains/ideas/objects";

describe("ContentService", () => {
  const repository = new ContentMemoryRepository();
  const service = new ContentService(repository);

  beforeEach(() => {
    repository.reset();
  });

  describe("create", () => {
    it("should create content with valid data", async () => {
      const content = await service.create(
        "Test Content",
        "Test Description",
        "abcdefghijk", // YouTube video ID
        1000, // view count
        {
          id: "channel123",
          name: "Test Channel",
          description: "Test Channel Description",
        },
        "user123", // owner ID
        "Test User", // owner name
      );

      expect(content).toEqual({
        id: "1",
        title: "Test Content",
        description: "Test Description",
        youtubeVideoId: "abcdefghijk",
        viewCount: 1000,
        author: {
          id: "channel123",
          name: "Test Channel",
          description: "Test Channel Description",
          imageUrl: undefined,
          subscriberCount: undefined,
        },
        owner: {
          id: "user123",
          name: "Test User",
        },
        mentionedEvents: [],
        relatedContents: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should throw an error with invalid title", async () => {
      await expect(
        service.create(
          "Te", // Too short
          "Test Description",
          "abcdefghijk",
          1000,
          {
            id: "channel123",
            name: "Test Channel",
          },
          "user123",
          "Test User",
        ),
      ).rejects.toThrow("Invalid content title");
    });

    it("should throw an error with invalid YouTube video ID", async () => {
      await expect(
        service.create(
          "Test Content",
          "Test Description",
          "abc", // Too short
          1000,
          {
            id: "channel123",
            name: "Test Channel",
          },
          "user123",
          "Test User",
        ),
      ).rejects.toThrow("Invalid YouTube video ID");
    });
  });

  describe("getOne", () => {
    it("should retrieve content by ID", async () => {
      // Create test content
      const created = await service.create(
        "Test Content",
        "Test Description",
        "abcdefghijk",
        1000,
        {
          id: "channel123",
          name: "Test Channel",
        },
        "user123",
        "Test User",
      );

      // Retrieve content
      const content = await service.getOne(created.id);

      // Should match created content
      expect(content).toEqual(created);
    });

    it("should throw an error if content not found", async () => {
      await expect(service.getOne("999")).rejects.toThrow("not found");
    });
  });

  describe("update", () => {
    it("should update content with valid data", async () => {
      // Create test content
      const created = await service.create(
        "Test Content",
        "Test Description",
        "abcdefghijk",
        1000,
        {
          id: "channel123",
          name: "Test Channel",
        },
        "user123",
        "Test User",
      );

      // Update content
      const updated = await service.update(created.id, {
        title: "Updated Content",
        description: "Updated Description",
      });

      // Should have updated fields
      expect(updated.title).toBe("Updated Content");
      expect(updated.description).toBe("Updated Description");
      // Other fields should remain the same
      expect(updated.youtubeVideoId).toBe(created.youtubeVideoId);
      expect(updated.viewCount).toBe(created.viewCount);
    });

    it("should throw an error with invalid title", async () => {
      // Create test content
      const created = await service.create(
        "Test Content",
        "Test Description",
        "abcdefghijk",
        1000,
        {
          id: "channel123",
          name: "Test Channel",
        },
        "user123",
        "Test User",
      );

      // Update with invalid title
      await expect(
        service.update(created.id, {
          title: "Te", // Too short
        }),
      ).rejects.toThrow("Invalid content title");
    });

    it("should throw an error if no update data provided", async () => {
      // Create test content
      const created = await service.create(
        "Test Content",
        "Test Description",
        "abcdefghijk",
        1000,
        {
          id: "channel123",
          name: "Test Channel",
        },
        "user123",
        "Test User",
      );

      // Update with empty data
      await expect(service.update(created.id, {})).rejects.toThrow(
        "No update data provided",
      );
    });
  });

  describe("remove", () => {
    it("should remove content", async () => {
      // Create test content
      const created = await service.create(
        "Test Content",
        "Test Description",
        "abcdefghijk",
        1000,
        {
          id: "channel123",
          name: "Test Channel",
        },
        "user123",
        "Test User",
      );

      // Remove content
      await service.remove(created.id);

      // Should throw error when trying to retrieve removed content
      await expect(service.getOne(created.id)).rejects.toThrow("not found");
    });
  });
});
