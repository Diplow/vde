import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MapDrizzlePostgresRepository } from "./map-drizzle-postgres-repository";
import { db } from "~/server/db";
import { maps } from "~/server/db/schema/maps";
import { mapItems } from "~/server/db/schema/map-items";
import { users } from "~/server/db/schema/users";
import { eq, sql } from "drizzle-orm";
import { HexDirection } from "~/lib/hex-coordinates";
import { OwnerEntity } from "~/lib/domains/mapping/objects";

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
  const TEST_USER_CLERK_ID = "test-user-id";
  const testRows = 15;
  const testColumns = 20;
  const testBaseSize = 60;

  // Clean up database before and after tests
  beforeAll(async () => {
    console.log("Setting up test database...");

    // Clean up existing data
    await db.delete(mapItems).execute();
    await db.delete(maps).execute();
    await db.delete(users).execute();

    // Create a test user
    await db.insert(users).values({
      id: 999999,
      clerkId: TEST_USER_CLERK_ID,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Created test user with ID 999999");
  });

  afterAll(async () => {
    // Clean up after tests
    await db.delete(mapItems).execute();
    await db.delete(maps).execute();
    await db.delete(users).execute();
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
      ownerId: TEST_USER_CLERK_ID,
      ownerType: "user",
      rows: testRows,
      columns: testColumns,
      baseSize: testBaseSize,
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
      expect(map.data.rows).toBe(testRows);
      expect(map.data.columns).toBe(testColumns);
      expect(map.data.baseSize).toBe(testBaseSize);
      expect(map.owner.data.id).toBe(TEST_USER_CLERK_ID);
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
        ownerId: TEST_USER_CLERK_ID,
        ownerType: "user",
        rows: 12,
        columns: 12,
        baseSize: 40,
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
      const ownerMaps = await repository.getByOwnerId(TEST_USER_CLERK_ID);

      // Assert
      expect(ownerMaps.length).toBeGreaterThan(0);
      if (ownerMaps[0]) {
        expect(ownerMaps[0].owner.data.id).toBe(TEST_USER_CLERK_ID);
      }
    });

    it("should return empty array when owner has no maps", async () => {
      // Act
      const noMaps = await repository.getByOwnerId("non-existent-user");

      // Assert
      expect(noMaps).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("should create a new map", async () => {
      // First delete the test map to avoid conflicts
      await db.delete(maps).where(eq(maps.id, TEST_ID));

      // Arrange
      const owner = new OwnerEntity({ id: TEST_USER_CLERK_ID });
      const dimensions = {
        rows: 25,
        columns: 30,
        baseSize: 45,
      };

      // Act
      const result = await repository.create(
        testMapName,
        testMapDescription,
        owner.data,
        dimensions,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.data.name).toBe(testMapName);
      expect(result.data.description).toBe(testMapDescription);
      expect(result.data.rows).toBe(dimensions.rows);
      expect(result.data.columns).toBe(dimensions.columns);
      expect(result.data.baseSize).toBe(dimensions.baseSize);
      expect(result.owner.data.id).toBe(TEST_USER_CLERK_ID);
      expect(result.items).toHaveLength(0);

      // Verify in database
      const mapInDb = await db.query.maps.findFirst({
        where: eq(maps.name, testMapName),
      });
      expect(mapInDb).toBeDefined();
      if (mapInDb) {
        expect(mapInDb.name).toBe(testMapName);
        expect(mapInDb.rows).toBe(dimensions.rows);
        expect(mapInDb.columns).toBe(dimensions.columns);
        expect(mapInDb.baseSize).toBe(dimensions.baseSize);

        // Clean up
        await db.delete(maps).where(eq(maps.id, mapInDb.id));
      }
    });

    it("should create a map with default dimensions when not specified", async () => {
      // First delete the test map to avoid conflicts
      await db.delete(maps).where(eq(maps.id, TEST_ID));

      // Arrange
      const owner = new OwnerEntity({ id: TEST_USER_CLERK_ID });

      // Act
      const result = await repository.create(
        testMapName,
        testMapDescription,
        owner.data,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.data.rows).toBe(10); // Default value
      expect(result.data.columns).toBe(10); // Default value
      expect(result.data.baseSize).toBe(50); // Default value

      // Clean up
      if (result.data.id) {
        await db.delete(maps).where(eq(maps.id, result.data.id));
      }
    });
  });

  describe("update", () => {
    it("should update an existing map", async () => {
      // Arrange
      const updatedName = "Updated Map Name";
      const updatedDescription = "Updated during test";
      const updatedRows = 8;
      const updatedColumns = 16;
      const updatedBaseSize = 75;

      // Act
      const updatedMap = await repository.update(TEST_ID, {
        name: updatedName,
        description: updatedDescription,
        rows: updatedRows,
        columns: updatedColumns,
        baseSize: updatedBaseSize,
      });

      // Assert
      expect(updatedMap.data.name).toBe(updatedName);
      expect(updatedMap.data.description).toBe(updatedDescription);
      expect(updatedMap.data.rows).toBe(updatedRows);
      expect(updatedMap.data.columns).toBe(updatedColumns);
      expect(updatedMap.data.baseSize).toBe(updatedBaseSize);

      // Verify in database
      const mapInDb = await db.query.maps.findFirst({
        where: eq(maps.id, TEST_ID),
      });
      if (mapInDb) {
        expect(mapInDb.name).toBe(updatedName);
        expect(mapInDb.description).toBe(updatedDescription);
        expect(mapInDb.rows).toBe(updatedRows);
        expect(mapInDb.columns).toBe(updatedColumns);
        expect(mapInDb.baseSize).toBe(updatedBaseSize);
      }
    });

    it("should update only specified fields", async () => {
      // Act - Update only rows and baseSize
      const updatedMap = await repository.update(TEST_ID, {
        rows: 5,
        baseSize: 80,
      });

      // Assert
      expect(updatedMap.data.name).toBe(testMapName); // Unchanged
      expect(updatedMap.data.description).toBe(testMapDescription); // Unchanged
      expect(updatedMap.data.rows).toBe(5); // Updated
      expect(updatedMap.data.columns).toBe(testColumns); // Unchanged
      expect(updatedMap.data.baseSize).toBe(80); // Updated
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
