import { describe, it, expect, beforeEach } from "vitest";
import {
  GenericMemoryRepository,
  GenericAttributes,
  GenericEntity,
} from "./generic-memory-repository";

// Define a test entity
interface TestAttributes extends GenericAttributes {
  name: string;
  value: number;
  isActive: boolean;
}

class TestEntity implements GenericEntity<TestAttributes> {
  readonly data: TestAttributes;

  constructor(data: TestAttributes) {
    this.data = { ...data };
  }
}

describe("GenericMemoryRepository", () => {
  let repository: GenericMemoryRepository<TestAttributes, TestEntity>;

  beforeEach(() => {
    repository = new GenericMemoryRepository<TestAttributes, TestEntity>(
      TestEntity,
    );
    repository.reset();
  });

  describe("create", () => {
    it("should create an entity with auto-generated id and timestamps", async () => {
      const entity = await repository.create({
        name: "Test Entity",
        value: 42,
        isActive: true,
      });

      expect(entity).toBeInstanceOf(TestEntity);
      expect(entity.data.id).toBe(1);
      expect(entity.data.name).toBe("Test Entity");
      expect(entity.data.value).toBe(42);
      expect(entity.data.isActive).toBe(true);
      expect(entity.data.createdAt).toBeInstanceOf(Date);
      expect(entity.data.updatedAt).toBeInstanceOf(Date);
    });

    it("should increment ids for multiple entities", async () => {
      const entity1 = await repository.create({
        name: "Entity 1",
        value: 1,
        isActive: true,
      });
      const entity2 = await repository.create({
        name: "Entity 2",
        value: 2,
        isActive: false,
      });
      const entity3 = await repository.create({
        name: "Entity 3",
        value: 3,
        isActive: true,
      });

      expect(entity1.data.id).toBe(1);
      expect(entity2.data.id).toBe(2);
      expect(entity3.data.id).toBe(3);
    });
  });

  describe("getOne", () => {
    it("should retrieve an entity by id", async () => {
      const created = await repository.create({
        name: "Test Entity",
        value: 42,
        isActive: true,
      });
      const retrieved = await repository.getOne(created.data.id);

      expect(retrieved).toBeInstanceOf(TestEntity);
      expect(retrieved.data).toEqual(created.data);
    });

    it("should throw an error if entity not found", async () => {
      await expect(repository.getOne(999)).rejects.toThrow("not found");
    });
  });

  describe("getMany", () => {
    it("should retrieve multiple entities with pagination", async () => {
      await repository.create({ name: "Entity 1", value: 1, isActive: true });
      await repository.create({ name: "Entity 2", value: 2, isActive: false });
      await repository.create({ name: "Entity 3", value: 3, isActive: true });

      const entities = await repository.getMany(2, 0);
      expect(entities).toHaveLength(2);
      expect(entities[0]?.data.name).toBe("Entity 1");
      expect(entities[1]?.data.name).toBe("Entity 2");

      const nextPage = await repository.getMany(2, 2);
      expect(nextPage).toHaveLength(1);
      expect(nextPage[0]?.data.name).toBe("Entity 3");
    });

    it("should return empty array if no entities", async () => {
      const entities = await repository.getMany();
      expect(entities).toEqual([]);
    });
  });

  describe("getByField", () => {
    it("should retrieve entities by field value", async () => {
      await repository.create({ name: "Active 1", value: 1, isActive: true });
      await repository.create({ name: "Inactive", value: 2, isActive: false });
      await repository.create({ name: "Active 2", value: 3, isActive: true });

      const activeEntities = await repository.getByField("isActive", true);
      expect(activeEntities).toHaveLength(2);
      expect(activeEntities[0]?.data.name).toBe("Active 1");
      expect(activeEntities[1]?.data.name).toBe("Active 2");

      const inactiveEntities = await repository.getByField("isActive", false);
      expect(inactiveEntities).toHaveLength(1);
      expect(inactiveEntities[0]?.data.name).toBe("Inactive");
    });

    it("should return empty array if no matching entities", async () => {
      await repository.create({ name: "Entity", value: 1, isActive: true });
      const entities = await repository.getByField("value", 999);
      expect(entities).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update an entity", async () => {
      const created = await repository.create({
        name: "Original",
        value: 1,
        isActive: true,
      });

      const updated = await repository.update(created.data.id, {
        name: "Updated",
        value: 2,
        isActive: false,
      });

      expect(updated.data.name).toBe("Updated");
      expect(updated.data.value).toBe(2);
      expect(updated.data.isActive).toBe(false);
      expect(updated.data.updatedAt).not.toEqual(created.data.updatedAt);

      // Verify the update persisted
      const retrieved = await repository.getOne(created.data.id);
      expect(retrieved.data).toEqual(updated.data);
    });

    it("should update only specified fields", async () => {
      const created = await repository.create({
        name: "Original",
        value: 1,
        isActive: true,
      });

      const updated = await repository.update(created.data.id, {
        name: "Updated",
      });

      expect(updated.data.name).toBe("Updated");
      expect(updated.data.value).toBe(1); // Unchanged
      expect(updated.data.isActive).toBe(true); // Unchanged
    });

    it("should throw an error if entity not found", async () => {
      await expect(repository.update(999, { name: "Updated" })).rejects.toThrow(
        "not found",
      );
    });
  });

  describe("remove", () => {
    it("should remove an entity", async () => {
      const created = await repository.create({
        name: "Entity",
        value: 1,
        isActive: true,
      });
      await repository.remove(created.data.id);

      // Verify the entity was removed
      await expect(repository.getOne(created.data.id)).rejects.toThrow(
        "not found",
      );
    });

    it("should throw an error if entity not found", async () => {
      await expect(repository.remove(999)).rejects.toThrow("not found");
    });
  });

  describe("reset", () => {
    it("should clear all entities and reset id counter", async () => {
      await repository.create({ name: "Entity 1", value: 1, isActive: true });
      await repository.create({ name: "Entity 2", value: 2, isActive: false });

      repository.reset();

      // Verify all entities are removed
      const entities = await repository.getMany();
      expect(entities).toEqual([]);

      // Verify id counter is reset
      const newEntity = await repository.create({
        name: "New Entity",
        value: 3,
        isActive: true,
      });
      expect(newEntity.data.id).toBe(1);
    });
  });
});
