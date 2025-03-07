import { describe, it, expect, beforeEach } from "vitest";
import { MapMemoryRepositoryGeneric as MapMemoryRepository } from "~/lib/infrastructure/mapping/repositories/map-memory-repository-generic";
import { ServiceMap } from "./services";

describe("MapService", () => {
  const repository = new MapMemoryRepository();
  const service = ServiceMap(repository);

  beforeEach(() => {
    repository.reset();
  });

  describe("create", () => {
    it("should create a map", async () => {
      const map = await service.create(
        "Test Map",
        "Test Description",
        "1",
        "user",
      );

      expect(map).toEqual({
        id: "1",
        name: "Test Map",
        description: "Test Description",
        ownerId: "1",
        ownerType: "user",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should create a map with null description", async () => {
      const map = await service.create("Test Map", null, "1", "user");

      expect(map).toEqual({
        id: "1",
        name: "Test Map",
        description: null,
        ownerId: "1",
        ownerType: "user",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe("getOne", () => {
    it("should get a map by id", async () => {
      const created = await service.create(
        "Test Map",
        "Test Description",
        "1",
        "user",
      );
      const map = await service.getOne(created.id);

      expect(map).toEqual(created);
    });

    it("should throw an error if map not found", async () => {
      await expect(service.getOne("999")).rejects.toThrow("not found");
    });

    it("should throw an error if id is invalid", async () => {
      await expect(service.getOne("invalid")).rejects.toThrow("Invalid ID");
    });
  });

  describe("getMany", () => {
    it("should get multiple maps with pagination", async () => {
      await service.create("Map 1", "Description 1", "1", "user");
      await service.create("Map 2", "Description 2", "1", "user");
      await service.create("Map 3", "Description 3", "1", "user");

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
      await service.create("Map 1", "Description 1", "1", "user");
      await service.create("Map 2", "Description 2", "1", "user");
      await service.create("Map 3", "Description 3", "2", "user");

      const userMaps = await service.getByOwnerId("1");
      expect(userMaps).toHaveLength(2);
      expect(userMaps[0]?.ownerId).toBe("1");
      expect(userMaps[1]?.ownerId).toBe("1");

      const otherUserMaps = await service.getByOwnerId("2");
      expect(otherUserMaps).toHaveLength(1);
      expect(otherUserMaps[0]?.ownerId).toBe("2");
    });

    it("should return empty array if no maps found for owner", async () => {
      const maps = await service.getByOwnerId("999");
      expect(maps).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update a map", async () => {
      const created = await service.create(
        "Test Map",
        "Test Description",
        "1",
        "user",
      );

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
      const created = await service.create(
        "Test Map",
        "Test Description",
        "1",
        "user",
      );

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
      const created = await service.create(
        "Test Map",
        "Test Description",
        "1",
        "user",
      );

      const updated = await service.update(created.id, {
        description: "Updated Description",
      });

      expect(updated).toEqual({
        ...created,
        description: "Updated Description",
        updatedAt: expect.any(String),
      });
    });

    it("should throw an error if no update data provided", async () => {
      const created = await service.create(
        "Test Map",
        "Test Description",
        "1",
        "user",
      );

      await expect(service.update(created.id, {})).rejects.toThrow(
        "No update data provided",
      );
    });
  });

  describe("remove", () => {
    it("should remove a map", async () => {
      const created = await service.create(
        "Test Map",
        "Test Description",
        "1",
        "user",
      );

      await service.remove(created.id);

      // Verify the map was removed
      await expect(service.getOne(created.id)).rejects.toThrow("not found");
    });

    it("should throw an error if map not found", async () => {
      await expect(service.remove("999")).rejects.toThrow("not found");
    });
  });
});
