import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MapDrizzlePostgresRepository } from "./map-drizzle-postgres-repository";
import { db } from "~/server/db";
import { maps } from "~/server/db/schema";
import { mapItems } from "~/server/db/schema/map-items";
import { users } from "~/server/db/schema/users";
import { eq, sql } from "drizzle-orm";
import { HexDirection } from "~/lib/hex-coordinates";
import { OwnerEntity } from "~/lib/domains/mapping/entities";

// Mark this test as integration
describe("MapDrizzlePostgresRepository Integration", () => {
  // Add a custom tag to the test context
  beforeAll(() => {
    // @ts-ignore - Adding custom metadata for test filtering
    describe.meta = { ...(describe.meta || {}), integration: true };
  });

  // Create repository instance with real DB
  const repository = MapDrizzlePostgresRepository(db);

  // Test data - use the SAME ID for all tests
  const TEST_ID = 999999;
  const testMapName = "Integration Test Map";
  const testMapDescription = "Created during integration testing";

  // Clean up database before and after tests
  beforeAll(async () => {
    console.log("Setting up test database...");

    // Delete any existing test data
    await db.delete(mapItems).where(eq(mapItems.mapId, TEST_ID));
    await db.delete(maps).where(eq(maps.id, TEST_ID));
    await db.delete(users).where(eq(users.id, TEST_ID));

    try {
      // Create test user with direct SQL to avoid schema issues
      await db.execute(sql`
        INSERT INTO deliberategg_users (id, clerk_id, email, image_url)
        VALUES (${TEST_ID}, 'test-clerk-id', ${`test-${TEST_ID}@example.com`}, NULL)
        ON CONFLICT (id) DO NOTHING
      `);
      console.log(`Created test user with ID ${TEST_ID}`);
    } catch (error) {
      console.error("Error setting up test user:", error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up after tests
    await db.delete(mapItems).where(eq(mapItems.mapId, TEST_ID));
    await db.delete(maps).where(eq(maps.id, TEST_ID));
    await db.delete(users).where(eq(users.id, TEST_ID));
  });

  // Reset before each test
  beforeEach(async () => {
    // Delete any existing test data
    await db.delete(mapItems).where(eq(mapItems.mapId, TEST_ID));
    await db.delete(maps).where(eq(maps.id, TEST_ID));

    // Insert a test map with ID matching the owner ID
    await db.insert(maps).values({
      id: TEST_ID,
      name: testMapName,
      description: testMapDescription,
      ownerId: TEST_ID,
      ownerType: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("getOne", () => {
    it("should retrieve a map by ID", async () => {
      // Act
      const map = await repository.getOne(TEST_ID);

      // Assert
      expect(map).toBeDefined();
      expect(map.data.id).toBe(TEST_ID);
      expect(map.data.name).toBe(testMapName);
      expect(map.data.description).toBe(testMapDescription);
      expect(map.owner.data.id).toBe(TEST_ID);
      expect(map.items).toHaveLength(0);
    });

    it("should throw an error when map doesn't exist", async () => {
      // Act & Assert
      await expect(repository.getOne(99999)).rejects.toThrow(
        "Map with ID 99999 not found",
      );
    });
  });

  describe("getMany", () => {
    it("should retrieve multiple maps with pagination", async () => {
      // Arrange - Create a second test map
      await db.insert(maps).values({
        id: 998,
        name: "Second Test Map",
        description: "Another test map",
        ownerId: TEST_ID,
        ownerType: "user",
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
      await db.delete(maps).where(eq(maps.id, 998));
    });
  });

  describe("getByOwnerId", () => {
    it("should retrieve maps by owner ID", async () => {
      // Act
      const ownerMaps = await repository.getByOwnerId(TEST_ID);

      // Assert
      expect(ownerMaps.length).toBeGreaterThan(0);
      if (ownerMaps[0]) {
        expect(ownerMaps[0].owner.data.id).toBe(TEST_ID);
      }
    });

    it("should return empty array when owner has no maps", async () => {
      // Act
      const noMaps = await repository.getByOwnerId(12345);

      // Assert
      expect(noMaps).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new map", async () => {
      // First delete the test map to avoid conflicts
      await db.delete(maps).where(eq(maps.id, TEST_ID));

      // Arrange
      const owner = new OwnerEntity({ id: TEST_ID });

      // Act
      const result = await repository.create(
        testMapName,
        testMapDescription,
        owner.data,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.data.name).toBe(testMapName);
      expect(result.data.description).toBe(testMapDescription);
      expect(result.owner.data.id).toBe(TEST_ID);
      expect(result.items).toHaveLength(0);

      // Verify in database
      const mapInDb = await db.query.maps.findFirst({
        where: eq(maps.name, testMapName),
      });
      expect(mapInDb).toBeDefined();
      if (mapInDb) {
        expect(mapInDb.name).toBe(testMapName);

        // Clean up
        await db.delete(maps).where(eq(maps.id, mapInDb.id));
      }
    });
  });

  describe("update", () => {
    it("should update an existing map", async () => {
      // Arrange
      const updatedName = "Updated Map Name";
      const updatedDescription = "Updated during test";

      // Act
      const updatedMap = await repository.update(TEST_ID, {
        name: updatedName,
        description: updatedDescription,
      });

      // Assert
      expect(updatedMap.data.name).toBe(updatedName);
      expect(updatedMap.data.description).toBe(updatedDescription);

      // Verify in database
      const mapInDb = await db.query.maps.findFirst({
        where: eq(maps.id, TEST_ID),
      });
      if (mapInDb) {
        expect(mapInDb.name).toBe(updatedName);
        expect(mapInDb.description).toBe(updatedDescription);
      }
    });

    it("should throw error when updating non-existent map", async () => {
      // Act & Assert
      await expect(
        repository.update(99999, { name: "Won't Update" }),
      ).rejects.toThrow("Failed to update map");
    });
  });

  describe("map items", () => {
    it("should create and retrieve map items", async () => {
      // Arrange - Add map items
      await db.insert(mapItems).values([
        {
          mapId: TEST_ID,
          itemId: 101,
          itemType: "resource",
          coordinates: {
            row: 0,
            col: 0,
            path: [] as HexDirection[],
          },
        },
        {
          mapId: TEST_ID,
          itemId: 102,
          itemType: "event",
          coordinates: {
            row: 1,
            col: 0,
            path: [] as HexDirection[],
          },
        },
      ]);

      // Act
      const map = await repository.getOne(TEST_ID);

      // Assert
      expect(map.items).toHaveLength(2);
      if (map.items[0] && map.items[1]) {
        expect(map.items[0].data.itemId).toBe(101);
        expect(map.items[0].data.itemType).toBe("resource");
        expect(map.items[1].data.itemId).toBe(102);
        expect(map.items[1].data.itemType).toBe("event");
      }
    });
  });

  describe("remove", () => {
    it("should delete a map", async () => {
      // Act
      await repository.remove(TEST_ID);

      // Assert - Map should no longer exist
      const mapInDb = await db.query.maps.findFirst({
        where: eq(maps.id, TEST_ID),
      });
      expect(mapInDb).toBeFalsy();
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
