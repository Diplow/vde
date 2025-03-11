import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { EventDrizzlePostgresRepository } from "./event-drizzle-postgres-repository";
import { db } from "~/server/db";
import { events } from "~/server/db/schema/events";
import { users } from "~/server/db/schema/users";
import { eq, sql } from "drizzle-orm";
import { AuthorEntity } from "~/lib/domains/politics/objects";

// Mark this test as integration
describe("EventDrizzlePostgresRepository Integration", () => {
  // Add a custom tag to the test context
  beforeAll(() => {
    // @ts-ignore - Adding custom metadata for test filtering
    describe.meta = { ...(describe.meta || {}), integration: true };
  });

  // Create repository instance with real DB
  const repository = EventDrizzlePostgresRepository(db);

  // Test data - use the SAME ID for all tests
  const TEST_ID = 999999;
  const TEST_USER_ID = 888888;
  const TEST_USER_CLERK_ID = "test-author-id";
  const testTitle = "Integration Test Event";
  const testDescription = "Created during integration testing";
  const testStartDate = new Date("2023-12-01T10:00:00Z");
  const testEndDate = new Date("2023-12-01T12:00:00Z");

  // Clean up database before and after tests
  beforeAll(async () => {
    console.log("Setting up test database...");

    // Clean up existing data
    await db.delete(events).execute();

    // Create a test user for foreign key constraint
    await db.delete(users).where(eq(users.id, TEST_USER_ID)).execute();
    await db
      .insert(users)
      .values({
        id: TEST_USER_ID,
        clerkId: TEST_USER_CLERK_ID,
        email: "test-author@example.com",
        firstName: "Test",
        lastName: "Author",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();

    console.log(
      `Created test user with ID ${TEST_USER_ID} and clerkId ${TEST_USER_CLERK_ID}`,
    );
  });

  afterAll(async () => {
    // Clean up after tests
    await db.delete(events).execute();
    await db.delete(users).where(eq(users.id, TEST_USER_ID)).execute();
  });

  // Reset before each test
  beforeEach(async () => {
    // Delete any existing test data
    await db.delete(events).where(eq(events.id, TEST_ID)).execute();

    // Insert a test event using Drizzle ORM
    await db
      .insert(events)
      .values({
        id: TEST_ID,
        title: testTitle,
        description: testDescription,
        startDate: testStartDate,
        endDate: testEndDate,
        authorId: TEST_USER_CLERK_ID, // Use the clerk ID that matches the foreign key
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
  });

  describe("getOne", () => {
    it("should retrieve an event by ID", async () => {
      // Act
      const event = await repository.getOne(TEST_ID);

      // Assert
      expect(event).toBeDefined();
      expect(event.data.id).toBe(TEST_ID);
      expect(event.data.title).toBe(testTitle);
      expect(event.data.description).toBe(testDescription);
      expect(event.data.startDate.toISOString()).toBe(
        testStartDate.toISOString(),
      );
      expect(event.data.endDate.toISOString()).toBe(testEndDate.toISOString());
      expect(event.author.data.id).toBe(TEST_USER_CLERK_ID);
    });

    it("should throw an error when event doesn't exist", async () => {
      // Act & Assert
      await expect(repository.getOne(99999)).rejects.toThrow(
        "Event with ID 99999 not found",
      );
    });
  });

  describe("getMany", () => {
    it("should retrieve multiple events with pagination", async () => {
      // Arrange - Create a second test event
      await db
        .insert(events)
        .values({
          id: 998,
          title: "Second Test Event",
          description: "Another test event",
          startDate: new Date("2023-12-02T10:00:00Z"),
          endDate: new Date("2023-12-02T12:00:00Z"),
          authorId: TEST_USER_CLERK_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();

      // Act - Get first page with limit 1
      const firstPage = await repository.getMany(1, 0);

      // Assert
      expect(firstPage).toHaveLength(1);

      // Act - Get second page
      const secondPage = await repository.getMany(1, 1);

      // Assert
      expect(secondPage).toHaveLength(1);
      if (firstPage[0] && secondPage[0]) {
        expect(firstPage[0].data.id).not.toBe(secondPage[0].data.id);
      }

      // Clean up
      await db.delete(events).where(eq(events.id, 998)).execute();
    });
  });

  describe("getByAuthorId", () => {
    it("should retrieve events by author ID", async () => {
      // Act
      const authorEvents = await repository.getByAuthorId(TEST_USER_CLERK_ID);

      // Assert
      expect(authorEvents.length).toBeGreaterThan(0);
      if (authorEvents[0]) {
        expect(authorEvents[0].author.data.id).toBe(TEST_USER_CLERK_ID);
      }
    });

    it("should return empty array when author has no events", async () => {
      // Act
      const noEvents = await repository.getByAuthorId("non-existent-author");

      // Assert
      expect(noEvents).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new event", async () => {
      // First delete the test event to avoid conflicts
      await db.delete(events).where(eq(events.id, TEST_ID)).execute();

      // Arrange
      const author = new AuthorEntity({ id: TEST_USER_CLERK_ID });
      const newTitle = "New Test Event";
      const newDescription = "New event description";
      const newStartDate = new Date("2023-12-03T10:00:00Z");
      const newEndDate = new Date("2023-12-03T12:00:00Z");

      // Act
      const result = await repository.create(
        newTitle,
        newDescription,
        newStartDate,
        newEndDate,
        author.data,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.data.title).toBe(newTitle);
      expect(result.data.description).toBe(newDescription);
      expect(result.data.startDate.toISOString()).toBe(
        newStartDate.toISOString(),
      );
      expect(result.data.endDate.toISOString()).toBe(newEndDate.toISOString());
      expect(result.author.data.id).toBe(TEST_USER_CLERK_ID);

      // Verify in database
      const eventInDb = await db.query.events.findFirst({
        where: eq(events.title, newTitle),
      });
      expect(eventInDb).toBeDefined();
      if (eventInDb) {
        expect(eventInDb.title).toBe(newTitle);
        expect(eventInDb.description).toBe(newDescription);
        expect(eventInDb.startDate.toISOString()).toBe(
          newStartDate.toISOString(),
        );
        expect(eventInDb.endDate.toISOString()).toBe(newEndDate.toISOString());

        // Clean up
        await db.delete(events).where(eq(events.id, eventInDb.id)).execute();
      }
    });
  });

  describe("update", () => {
    it("should update an existing event", async () => {
      // Arrange
      const updatedTitle = "Updated Event Title";
      const updatedDescription = "Updated during test";
      const updatedStartDate = new Date("2023-12-04T10:00:00Z");
      const updatedEndDate = new Date("2023-12-04T12:00:00Z");

      // Act
      const updatedEvent = await repository.update(TEST_ID, {
        title: updatedTitle,
        description: updatedDescription,
        startDate: updatedStartDate,
        endDate: updatedEndDate,
      });

      // Assert
      expect(updatedEvent.data.title).toBe(updatedTitle);
      expect(updatedEvent.data.description).toBe(updatedDescription);
      expect(updatedEvent.data.startDate.toISOString()).toBe(
        updatedStartDate.toISOString(),
      );
      expect(updatedEvent.data.endDate.toISOString()).toBe(
        updatedEndDate.toISOString(),
      );

      // Verify in database
      const eventInDb = await db.query.events.findFirst({
        where: eq(events.id, TEST_ID),
      });
      if (eventInDb) {
        expect(eventInDb.title).toBe(updatedTitle);
        expect(eventInDb.description).toBe(updatedDescription);
        expect(eventInDb.startDate.toISOString()).toBe(
          updatedStartDate.toISOString(),
        );
        expect(eventInDb.endDate.toISOString()).toBe(
          updatedEndDate.toISOString(),
        );
      }
    });

    it("should update only specified fields", async () => {
      // Act - Update only title and startDate
      const updatedEvent = await repository.update(TEST_ID, {
        title: "Partially Updated Event",
        startDate: new Date("2023-12-05T10:00:00Z"),
      });

      // Assert
      expect(updatedEvent.data.title).toBe("Partially Updated Event"); // Updated
      expect(updatedEvent.data.description).toBe(testDescription); // Unchanged
      expect(updatedEvent.data.startDate.toISOString()).toBe(
        new Date("2023-12-05T10:00:00Z").toISOString(),
      ); // Updated
      expect(updatedEvent.data.endDate.toISOString()).toBe(
        testEndDate.toISOString(),
      ); // Unchanged
    });

    it("should throw error when updating non-existent event", async () => {
      // Act & Assert
      await expect(
        repository.update(99999, { title: "Won't Update" }),
      ).rejects.toThrow("Failed to update event");
    });
  });

  describe("remove", () => {
    it("should delete an event", async () => {
      // Act
      await repository.remove(TEST_ID);

      // Assert - Event should no longer exist
      const eventInDb = await db.query.events.findFirst({
        where: eq(events.id, TEST_ID),
      });
      expect(eventInDb).toBeFalsy();
    });

    it("should throw error when deleting non-existent event", async () => {
      // Act & Assert
      await expect(repository.remove(99999)).rejects.toThrow(
        "Event with ID 99999 not found or already deleted",
      );
    });
  });

  describe("Database Connection Test", () => {
    it("should connect to the test database", async () => {
      // Execute a query to get the current database name
      const result = await db.execute(sql`SELECT current_database()`);
      console.log("🔍 CURRENT DATABASE:", result[0]?.current_database);
      expect(result[0]?.current_database).toBeDefined();
    });
  });
});
