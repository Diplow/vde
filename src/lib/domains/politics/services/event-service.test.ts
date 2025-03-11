import { describe, it, expect, beforeEach } from "vitest";
import { EventMemoryRepositoryGeneric } from "~/lib/infrastructure/politics/repositories/event-memory-repository-generic";
import { EventService } from "~/lib/domains/politics/services";

describe("EventService", () => {
  // Setup test repository and service
  const repository = new EventMemoryRepositoryGeneric();
  const eventService = EventService(repository);

  // Test data
  const testEvent = {
    title: "Test Event",
    description: "Test Description",
    startDate: "2023-12-01T10:00:00Z",
    endDate: "2023-12-01T12:00:00Z",
    authorId: "123",
  };

  beforeEach(() => {
    // Reset repository before each test
    repository.reset();
  });

  describe("create", () => {
    it("should create an event and return the contract", async () => {
      const result = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // Check contract format
      expect(result).toMatchObject({
        title: testEvent.title,
        description: testEvent.description,
        startDate: expect.any(String),
        endDate: expect.any(String),
        author: { id: testEvent.authorId },
        id: expect.any(String),
        createdAt: expect.any(String),
      });

      // Verify dates are in ISO format
      expect(new Date(result.startDate).toISOString()).toBe(result.startDate);
      expect(new Date(result.endDate).toISOString()).toBe(result.endDate);
    });
  });

  describe("getOne", () => {
    it("should retrieve an event by ID", async () => {
      // Create an event first
      const created = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // Retrieve it
      const retrieved = await eventService.getOne(created.id);

      // Verify it matches
      expect(retrieved).toEqual(created);
    });

    it("should throw error for non-existent ID", async () => {
      await expect(eventService.getOne("999")).rejects.toThrow();
    });

    it("should throw error for invalid ID format", async () => {
      await expect(eventService.getOne("abc")).rejects.toThrow("Invalid ID");
    });
  });

  describe("getMany", () => {
    it("should retrieve multiple events with pagination", async () => {
      // Create multiple events
      for (let i = 0; i < 5; i++) {
        await eventService.create(
          `Event ${i}`,
          `Description ${i}`,
          new Date(2023, 11, i + 1, 10, 0).toISOString(),
          new Date(2023, 11, i + 1, 12, 0).toISOString(),
          testEvent.authorId,
        );
      }

      // Test pagination
      const result = await eventService.getMany(2, 1);

      // Should return 2 events, starting from the second one
      expect(result).toHaveLength(2);
      expect(result[0]?.title).toBe("Event 1");
      expect(result[1]?.title).toBe("Event 2");
    });

    it("should use default pagination when not specified", async () => {
      // Create multiple events
      for (let i = 0; i < 60; i++) {
        await eventService.create(
          `Event ${i}`,
          `Description ${i}`,
          new Date(2023, 11, 1, 10, 0).toISOString(),
          new Date(2023, 11, 1, 12, 0).toISOString(),
          testEvent.authorId,
        );
      }

      // Test default pagination (should be 50)
      const result = await eventService.getMany();
      expect(result).toHaveLength(50);
    });
  });

  describe("update", () => {
    it("should update an event", async () => {
      // Create an event first
      const created = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // Update it
      const updated = await eventService.update(created.id, {
        title: "Updated Title",
        description: "Updated Description",
      });

      // Verify updates
      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated Description");
      expect(updated.startDate).toBe(created.startDate);
      expect(updated.endDate).toBe(created.endDate);
    });

    it("should update dates correctly", async () => {
      // Create an event first
      const created = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // New dates
      const newStartDate = "2023-12-15T09:00:00.000Z";
      const newEndDate = "2023-12-15T17:00:00.000Z";

      // Update it
      const updated = await eventService.update(created.id, {
        startDate: newStartDate,
        endDate: newEndDate,
      });

      // Verify updates
      expect(updated.startDate).toBe(newStartDate);
      expect(updated.endDate).toBe(newEndDate);
    });

    it("should throw error when no update data provided", async () => {
      // Create an event first
      const created = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // Try to update with empty object
      await expect(eventService.update(created.id, {})).rejects.toThrow(
        "No update data provided",
      );
    });
  });

  describe("remove", () => {
    it("should delete an event", async () => {
      // Create an event first
      const created = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // Delete it
      await eventService.remove(created.id);

      // Try to retrieve it - should fail
      await expect(eventService.getOne(created.id)).rejects.toThrow();
    });

    it("should throw error for non-existent ID", async () => {
      await expect(eventService.remove("999")).rejects.toThrow();
    });
  });

  describe("data adaptation", () => {
    it("should convert numeric IDs to strings in the contract", async () => {
      // Create an event
      const created = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // Verify ID is a string
      expect(typeof created.id).toBe("string");
      expect(typeof created.author.id).toBe("string");

      // Verify we can parse it back to a number
      expect(Number.isInteger(parseInt(created.id, 10))).toBe(true);
    });

    it("should format dates as ISO strings", async () => {
      // Create an event
      const created = await eventService.create(
        testEvent.title,
        testEvent.description,
        testEvent.startDate,
        testEvent.endDate,
        testEvent.authorId,
      );

      // Verify dates are ISO strings
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(created.startDate).toMatch(isoDatePattern);
      expect(created.endDate).toMatch(isoDatePattern);
      expect(created.createdAt).toMatch(isoDatePattern);
    });
  });
});
