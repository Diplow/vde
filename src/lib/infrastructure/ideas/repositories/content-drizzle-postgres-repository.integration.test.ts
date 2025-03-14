import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { ContentDrizzlePostgresRepository } from "./content-drizzle-postgres-repository";
import { db } from "~/server/db";
import { contents } from "~/server/db/schema/content";
import { contentEvents } from "~/server/db/schema/relations";
import { events } from "~/server/db/schema/events";
import { users } from "~/server/db/schema/users";
import { eq, sql } from "drizzle-orm";
import { AuthorEntity } from "~/lib/domains/ideas/objects";

// Mark this test as integration
describe("ContentDrizzlePostgresRepository Integration", () => {
  // Add a custom tag to the test context
  beforeAll(() => {
    // @ts-ignore - Adding custom metadata for test filtering
    describe.meta = { ...(describe.meta || {}), integration: true };
  });

  // Create repository instance with real DB
  const repository = ContentDrizzlePostgresRepository(db);

  // Test data - use the SAME ID for all tests
  const TEST_CONTENT_ID = 888888;
  const TEST_EVENT_ID = 777777;
  const testContentTitle = "Integration Test Content";
  const testContentDescription = "Created during integration testing";
  const TEST_USER_CLERK_ID = "test-author-id";
  const testYoutubeVideoId = "dQw4w9WgXcQ"; // Rick Astley - Never Gonna Give You Up
  const testViewCount = 1000;
  // Generate a unique email with timestamp to avoid conflicts
  const testUserEmail = `test-${Date.now()}@example.com`;

  // Clean up database before and after tests
  beforeAll(async () => {
    console.log("Setting up test database...");

    // Clean up existing data
    await db.delete(contentEvents).execute();
    await db.delete(contents).execute();
    await db.delete(events).execute();

    // Ensure test user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, TEST_USER_CLERK_ID),
    });

    if (!existingUser) {
      // Create a test user with unique email
      await db.insert(users).values({
        clerkId: TEST_USER_CLERK_ID,
        email: testUserEmail,
        firstName: "Test",
        lastName: "Author",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Created test user with clerkId", TEST_USER_CLERK_ID);
    }

    // Create a test event
    await db.insert(events).values({
      id: TEST_EVENT_ID,
      title: "Test Event",
      description: "Test event description",
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000), // 1 hour later
      authorId: TEST_USER_CLERK_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Created test event with ID", TEST_EVENT_ID);
  });

  afterAll(async () => {
    // Clean up after tests
    await db.delete(contentEvents).execute();
    await db.delete(contents).execute();
    await db.delete(events).where(eq(events.id, TEST_EVENT_ID)).execute();
    // Also delete the test user we created
    await db
      .delete(users)
      .where(eq(users.clerkId, TEST_USER_CLERK_ID))
      .execute();
  });

  // Reset before each test
  beforeEach(async () => {
    // Delete any existing test content and relations
    await db.delete(contentEvents).execute();
    await db.delete(contents).where(eq(contents.id, TEST_CONTENT_ID)).execute();

    // Insert a test content with a fixed ID
    await db.insert(contents).values({
      id: TEST_CONTENT_ID,
      title: testContentTitle,
      description: testContentDescription,
      youtubeVideoId: testYoutubeVideoId,
      viewCount: testViewCount,
      authorId: TEST_USER_CLERK_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("getOne", () => {
    it("should retrieve content by ID", async () => {
      // Act
      const content = await repository.getOne(TEST_CONTENT_ID);

      // Assert
      expect(content).toBeDefined();
      expect(content.data.id).toBe(TEST_CONTENT_ID);
      expect(content.data.title).toBe(testContentTitle);
      expect(content.data.description).toBe(testContentDescription);
      expect(content.data.youtubeVideoId).toBe(testYoutubeVideoId);
      expect(content.data.viewCount).toBe(testViewCount);
      expect(content.author.data.id).toBe(TEST_USER_CLERK_ID);
      expect(content.mentionedEvents).toHaveLength(0);
    });

    it("should throw an error when content doesn't exist", async () => {
      // Act & Assert
      await expect(repository.getOne(99999)).rejects.toThrow(
        "Content with ID 99999 not found",
      );
    });
  });

  describe("getMany", () => {
    it("should retrieve multiple contents with pagination", async () => {
      // Arrange - Create a second test content
      await db.insert(contents).values({
        id: TEST_CONTENT_ID + 1,
        title: "Second Test Content",
        description: "Another test content",
        youtubeVideoId: "xvFZjo5PgG0", // Rick Roll variation
        viewCount: 500,
        authorId: TEST_USER_CLERK_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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
      await db
        .delete(contents)
        .where(eq(contents.id, TEST_CONTENT_ID + 1))
        .execute();
    });
  });

  describe("create", () => {
    it("should create new content", async () => {
      // First delete the test content to avoid conflicts
      await db
        .delete(contents)
        .where(eq(contents.id, TEST_CONTENT_ID))
        .execute();

      // Arrange
      const authorEntity = new AuthorEntity({
        id: TEST_USER_CLERK_ID,
        name: "Test Author",
      });

      // Act
      const result = await repository.create(
        testContentTitle,
        testContentDescription,
        testYoutubeVideoId,
        testViewCount,
        authorEntity,
        { id: TEST_USER_CLERK_ID, name: "Test Author" },
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.data.title).toBe(testContentTitle);
      expect(result.data.description).toBe(testContentDescription);
      expect(result.data.youtubeVideoId).toBe(testYoutubeVideoId);
      expect(result.data.viewCount).toBe(testViewCount);
      expect(result.author.data.id).toBe(TEST_USER_CLERK_ID);
      expect(result.mentionedEvents).toHaveLength(0);

      // Verify in database
      const contentInDb = await db.query.contents.findFirst({
        where: eq(contents.title, testContentTitle),
      });
      expect(contentInDb).toBeDefined();
      if (contentInDb) {
        expect(contentInDb.title).toBe(testContentTitle);
        expect(contentInDb.youtubeVideoId).toBe(testYoutubeVideoId);
      }
    });
  });

  describe("update", () => {
    it("should update existing content", async () => {
      // Arrange
      const updatedTitle = "Updated Content Title";
      const updatedDescription = "Updated during test";
      const updatedYoutubeVideoId = "xvFZjo5PgG0"; // Another Rick Roll variation
      const updatedViewCount = 2000;

      // Act
      const updatedContent = await repository.update(TEST_CONTENT_ID, {
        title: updatedTitle,
        description: updatedDescription,
        youtubeVideoId: updatedYoutubeVideoId,
        viewCount: updatedViewCount,
      });

      // Assert
      expect(updatedContent.data.title).toBe(updatedTitle);
      expect(updatedContent.data.description).toBe(updatedDescription);
      expect(updatedContent.data.youtubeVideoId).toBe(updatedYoutubeVideoId);
      expect(updatedContent.data.viewCount).toBe(updatedViewCount);

      // Verify in database
      const contentInDb = await db.query.contents.findFirst({
        where: eq(contents.id, TEST_CONTENT_ID),
      });
      if (contentInDb) {
        expect(contentInDb.title).toBe(updatedTitle);
        expect(contentInDb.description).toBe(updatedDescription);
        expect(contentInDb.youtubeVideoId).toBe(updatedYoutubeVideoId);
        expect(contentInDb.viewCount).toBe(updatedViewCount);
      }
    });

    it("should update only specified fields", async () => {
      // Act - Update only title and viewCount
      const updatedContent = await repository.update(TEST_CONTENT_ID, {
        title: "Partially Updated Title",
        viewCount: 1500,
      });

      // Assert
      expect(updatedContent.data.title).toBe("Partially Updated Title");
      expect(updatedContent.data.description).toBe(testContentDescription); // Unchanged
      expect(updatedContent.data.youtubeVideoId).toBe(testYoutubeVideoId); // Unchanged
      expect(updatedContent.data.viewCount).toBe(1500); // Updated
    });

    it("should throw error when updating non-existent content", async () => {
      // Act & Assert
      await expect(
        repository.update(99999, { title: "Won't Update" }),
      ).rejects.toThrow("Failed to update content");
    });
  });

  describe("content events", () => {
    it("should add and retrieve content events", async () => {
      // Add a relation between content and event
      await db.insert(contentEvents).values({
        contentId: TEST_CONTENT_ID,
        eventId: TEST_EVENT_ID,
      });

      // Retrieve the content with events
      const content = await repository.getOne(TEST_CONTENT_ID);

      // Assert the event relation exists
      expect(content.mentionedEvents).toHaveLength(1);
      if (content.mentionedEvents[0]) {
        expect(content.mentionedEvents[0].data.id).toBe(TEST_EVENT_ID);
      }
    });

    it("should remove content events", async () => {
      // First add a relation
      await db.insert(contentEvents).values({
        contentId: TEST_CONTENT_ID,
        eventId: TEST_EVENT_ID,
      });

      // Verify it exists
      const contentBefore = await repository.getOne(TEST_CONTENT_ID);
      expect(contentBefore.mentionedEvents).toHaveLength(1);

      // Remove the relation
      await repository.removeMentionedEvent(TEST_CONTENT_ID, TEST_EVENT_ID);

      // Check that it's gone
      const contentAfter = await repository.getOne(TEST_CONTENT_ID);
      expect(contentAfter.mentionedEvents).toHaveLength(0);
    });
  });

  describe("remove", () => {
    it("should delete content", async () => {
      // Act
      await repository.remove(TEST_CONTENT_ID);

      // Assert - Content should no longer exist
      const contentInDb = await db.query.contents.findFirst({
        where: eq(contents.id, TEST_CONTENT_ID),
      });
      expect(contentInDb).toBeFalsy();
    });
  });

  describe("Database Connection Test", () => {
    it("should connect to the test database", async () => {
      // Execute a query to get the current database name
      const result = await db.execute(sql`SELECT current_database()`);
      console.log("🔍 USING TEST DATABASE:", result[0]?.current_database);
      expect(result[0]?.current_database).toBeDefined();
    });
  });
});
