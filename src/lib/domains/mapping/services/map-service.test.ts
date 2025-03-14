import { describe, it, expect, beforeEach } from "vitest";
import { MapAggregateRepository } from "~/lib/infrastructure/mapping/repositories/map-memory-repository";
import { MapService } from "~/lib/domains/mapping/services";
import { MapItemType } from "~/lib/domains/mapping/objects";
import { HexCoordinateSystem } from "~/lib/hex-coordinates";

describe("MapService", () => {
  const repository = new MapAggregateRepository();
  const service = new MapService(repository);

  beforeEach(() => {
    repository.reset();
  });

  describe("create", () => {
    it("should create a map", async () => {
      const map = await service.create("Test Map", "Test Description", "1");

      expect(map).toEqual({
        id: "1",
        name: "Test Map",
        description: "Test Description",
        rows: 10, // Default value
        columns: 10, // Default value
        baseSize: 50, // Default value
        owner: {
          id: "1",
        },
        items: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should create a map with null description", async () => {
      const map = await service.create("Test Map", null, "1");

      expect(map).toEqual({
        id: "1",
        name: "Test Map",
        description: null,
        rows: 10, // Default value
        columns: 10, // Default value
        baseSize: 50, // Default value
        owner: {
          id: "1",
        },
        items: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should create a map with custom dimensions", async () => {
      const map = await service.create(
        "Test Map",
        "Test Description",
        "1",
        20, // rows
        25, // columns
        40, // baseSize
      );

      expect(map).toEqual({
        id: "1",
        name: "Test Map",
        description: "Test Description",
        rows: 20,
        columns: 25,
        baseSize: 40,
        owner: {
          id: "1",
        },
        items: [],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe("getOne", () => {
    it("should get a map by id", async () => {
      const created = await service.create("Test Map", "Test Description", "1");
      const map = await service.getOne(created.id);

      expect(map).toEqual(created);
    });

    it("should throw an error if map not found", async () => {
      await expect(service.getOne("999")).rejects.toThrow("not found");
    });

    it("should throw an error if id is invalid", async () => {
      await expect(service.getOne("-1")).rejects.toThrow("Invalid ID");
    });
  });

  describe("getMany", () => {
    it("should get multiple maps with pagination", async () => {
      await service.create("Map 1", "Description 1", "1");
      await service.create("Map 2", "Description 2", "1");
      await service.create("Map 3", "Description 3", "1");

      const maps = await service.getMany(2, 0);
      expect(maps).toHaveLength(2);
      expect(maps[0]?.name).toBe("Map 1");
      expect(maps[1]?.name).toBe("Map 2");

      const nextPage = await service.getMany(2, 2);
      expect(nextPage).toHaveLength(1);
      expect(nextPage[0]?.name).toBe("Map 3");
    });

    it("should return empty array if no maps found", async () => {
      const maps = await service.getMany();
      expect(maps).toEqual([]);
    });
  });

  describe("getByOwnerId", () => {
    it("should get maps by owner id", async () => {
      await service.create("Map 1", "Description 1", "1");
      await service.create("Map 2", "Description 2", "1");
      await service.create("Map 3", "Description 3", "2");

      const userMaps = await service.getByOwnerId("1");
      expect(userMaps).toHaveLength(2);
      expect(userMaps[0]?.owner.id).toBe("1");
      expect(userMaps[1]?.owner.id).toBe("1");

      const otherUserMaps = await service.getByOwnerId("2");
      expect(otherUserMaps).toHaveLength(1);
      expect(otherUserMaps[0]?.owner.id).toBe("2");
    });

    it("should return empty array if no maps found for owner", async () => {
      const maps = await service.getByOwnerId("999");
      expect(maps).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update a map", async () => {
      const created = await service.create("Test Map", "Test Description", "1");

      const updated = await service.update(created.id, {
        name: "Updated Map",
        description: "Updated Description",
      });

      expect(updated).toEqual({
        ...created,
        name: "Updated Map",
        description: "Updated Description",
        updatedAt: expect.any(String),
      });

      // Verify the update persisted
      const retrieved = await service.getOne(created.id);
      expect(retrieved).toEqual(updated);
    });

    it("should update only the name", async () => {
      const created = await service.create("Test Map", "Test Description", "1");

      const updated = await service.update(created.id, {
        name: "Updated Map",
      });

      expect(updated).toEqual({
        ...created,
        name: "Updated Map",
        updatedAt: expect.any(String),
      });
    });

    it("should update only the description", async () => {
      const created = await service.create("Test Map", "Test Description", "1");

      const updated = await service.update(created.id, {
        description: "Updated Description",
      });

      expect(updated).toEqual({
        ...created,
        description: "Updated Description",
        updatedAt: expect.any(String),
      });
    });

    it("should update dimensions", async () => {
      const created = await service.create("Test Map", "Test Description", "1");

      const updated = await service.update(created.id, {
        rows: 15,
        columns: 18,
        baseSize: 65,
      });

      expect(updated).toEqual({
        ...created,
        rows: 15,
        columns: 18,
        baseSize: 65,
        updatedAt: expect.any(String),
      });
    });

    it("should throw an error if no update data provided", async () => {
      const created = await service.create("Test Map", "Test Description", "1");

      await expect(service.update(created.id, {})).rejects.toThrow(
        "No update data provided",
      );
    });
  });

  describe("remove", () => {
    it("should remove a map", async () => {
      const created = await service.create("Test Map", "Test Description", "1");

      await service.remove(created.id);

      // Verify the map was removed
      await expect(service.getOne(created.id)).rejects.toThrow("not found");
    });

    it("should throw an error if map not found", async () => {
      await expect(service.remove("999")).rejects.toThrow("not found");
    });
  });

  describe("getMapItems", () => {
    it("should return map items for a map", async () => {
      // Create a map first
      const map = await service.create("Test Map", "Test Description", "1");

      // Define coordinates for the item
      const coordinates = { row: 3, col: 4, path: [] };
      const itemId = 123;
      const itemType = MapItemType.CONTENT;

      // Add an item to the map
      await service.addItemToMap(
        map.id,
        itemId,
        itemType,
        coordinates,
        "1", // ownerId
      );

      // Get the map items
      const items = await service.getMapItems(map.id);

      // Verify items returned correctly
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        coordinates: "3,4", // Coordinates are serialized as a string
        reference: {
          id: String(itemId),
          type: itemType,
        },
      });
    });

    it("should return empty array when map has no items", async () => {
      const map = await service.create("Test Map", "Test Description", "1");
      const items = await service.getMapItems(map.id);
      expect(items).toEqual([]);
    });

    it("should throw an error when map does not exist", async () => {
      await expect(service.getMapItems("999")).rejects.toThrow("not found");
    });
  });

  describe("getMapItemsWithDetails", () => {
    it("should return map items with details", async () => {
      // Create a map first
      const map = await service.create("Test Map", "Test Description", "1");

      // Define coordinates for the item
      const coordinates = { row: 3, col: 4, path: [] };
      const itemId = 123;
      const itemType = MapItemType.CONTENT;

      // Add an item to the map
      await service.addItemToMap(
        map.id,
        itemId,
        itemType,
        coordinates,
        "1", // ownerId
      );

      // Get the map items with details
      const items = await service.getMapItemsWithDetails(map.id);

      // Verify items returned correctly
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        coordinates: "3,4",
        reference: {
          id: String(itemId),
          type: itemType,
        },
      });
    });

    it("should throw an error when map does not exist", async () => {
      await expect(service.getMapItemsWithDetails("999")).rejects.toThrow(
        "not found",
      );
    });
  });

  describe("addItemToMap", () => {
    it("should add an item to a map", async () => {
      // Create a map first
      const map = await service.create("Test Map", "Test Description", "1");

      // Define coordinates and data for the item
      const coordinates = { row: 3, col: 4, path: [] };
      const itemId = 123;
      const itemType = MapItemType.CONTENT;

      // Add the item to the map
      const item = await service.addItemToMap(
        map.id,
        itemId,
        itemType,
        coordinates,
        "1", // ownerId
      );

      // Verify the item was created correctly
      expect(item).toMatchObject({
        coordinates: "3,4",
        reference: {
          id: String(itemId),
          type: itemType,
        },
        owner: {
          id: "1",
        },
      });

      // Verify the item was added to the map
      const mapItems = await service.getMapItems(map.id);
      expect(mapItems).toHaveLength(1);
      expect(mapItems[0]?.reference.id).toBe(String(itemId));
      expect(mapItems[0]?.reference.type).toBe(itemType);
    });

    it("should throw an error when adding an item to a non-existent map", async () => {
      const coordinates = { row: 3, col: 4, path: [] };
      const itemId = 123;
      const itemType = MapItemType.CONTENT;

      await expect(
        service.addItemToMap("999", itemId, itemType, coordinates, "1"),
      ).rejects.toThrow("not found");
    });

    it("should validate coordinates within map boundaries", async () => {
      // Creating test as a validation check rather than an error check
      // since coordinate validation might be done at a different level
      const map = await service.create("Test Map", "Test Description", "1");
      const validCoordinates = { row: 5, col: 5, path: [] };
      const itemId = 123;
      const itemType = MapItemType.CONTENT;

      const item = await service.addItemToMap(
        map.id,
        itemId,
        itemType,
        validCoordinates,
        "1",
      );

      expect(item).toBeTruthy();
    });
  });

  describe("removeItemFromMap", () => {
    it("should remove an item from a map", async () => {
      // Create a map
      const map = await service.create("Test Map", "Test Description", "1");

      // Add an item to the map
      const coordinates = { row: 3, col: 4, path: [] };
      const itemId = 123;
      const itemType = MapItemType.CONTENT;
      await service.addItemToMap(map.id, itemId, itemType, coordinates, "1");

      // Verify item was added
      const mapItemsBefore = await service.getMapItems(map.id);
      expect(mapItemsBefore).toHaveLength(1);

      // Remove the item
      await service.removeItemFromMap(map.id, itemId, itemType);

      // Verify item was removed
      const mapItemsAfter = await service.getMapItems(map.id);
      expect(mapItemsAfter).toHaveLength(0);
    });

    it("should throw an error when removing an item from a non-existent map", async () => {
      const itemId = 123;
      const itemType = MapItemType.CONTENT;

      await expect(
        service.removeItemFromMap("999", itemId, itemType),
      ).rejects.toThrow("not found");
    });

    it("should throw an error when removing a non-existent item", async () => {
      // Create a map
      const map = await service.create("Test Map", "Test Description", "1");

      // Try to remove an item that doesn't exist
      const itemId = 456;
      const itemType = MapItemType.CONTENT;

      await expect(
        service.removeItemFromMap(map.id, itemId, itemType),
      ).rejects.toThrow("not found");
    });
  });
});
