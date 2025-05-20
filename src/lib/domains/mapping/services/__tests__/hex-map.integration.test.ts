import { describe, beforeEach } from "vitest";
import { MapService } from "~/lib/domains/mapping/services";
import type {
  MapRepository,
  MapItemRepository,
  BaseItemRepository,
} from "../../_repositories";

import { DbHexMapRepository } from "../../infrastructure/hex-map/db";
import { DbMapItemRepository } from "../../infrastructure/map-item/db";
import { DbBaseItemRepository } from "../../infrastructure/base-item/db";

import { db } from "~/server/db";
import { mapItems, baseItems, hexMaps } from "~/server/db/schema";
import { HexCoordSystem, HexDirection } from "../../utils/hex-coordinates";
import { MAPPING_ERRORS } from "../../types/errors";
import { MapContract, MapItemContract } from "../../types/contracts";

interface TestRepositories {
  map: MapRepository;
  mapItem: MapItemRepository;
  baseItem: BaseItemRepository;
}

interface TestEnvironment {
  service: MapService;
  repositories: TestRepositories;
}

async function cleanupDatabase() {
  await db.delete(hexMaps);
  await db.delete(mapItems);
  await db.delete(baseItems);
}

describe("MapService [Integration - DB]", () => {
  let testEnv: TestEnvironment;

  // DB Repos can often be instantiated once
  const dbRepos: TestRepositories = {
    map: new DbHexMapRepository(db),
    mapItem: new DbMapItemRepository(db),
    baseItem: new DbBaseItemRepository(db),
  };

  beforeEach(async () => {
    await cleanupDatabase(); // Clean DB before each test
    // Create a new service instance with the DB repos for the test run
    const service = new MapService(dbRepos);
    testEnv = { service, repositories: dbRepos };
  });

  describe("create", () => {
    it("should create a map", async () => {
      const createArgs = {
        title: "Test HexMap",
        descr: "Test Description",
        ownerId: "1",
      };
      // Use service from testEnv
      const map = await testEnv.service.create(createArgs);

      const expectedCenter = {
        id: expect.any(String),
        name: createArgs.title,
        descr: createArgs.descr,
        coords: "0,0",
      };
      expect(map).toMatchObject({
        id: expect.any(String),
        title: createArgs.title,
        descr: createArgs.descr,
        itemCount: 1,
        center: expect.objectContaining(expectedCenter),
      });
      const items = await testEnv.service.getItems({ mapId: map.id });
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        ...expectedCenter,
        mapId: map.id,
      });
    });
  });

  describe("getOne", () => {
    it("should get a map by ID", async () => {
      // Use service from testEnv
      const created = await testEnv.service.create({
        title: "Test HexMap",
        descr: "Test Description",
        ownerId: "1",
      });

      const retrieved = await testEnv.service.getOne(created.id);

      expect(retrieved).toMatchObject({
        id: created.id,
        title: created.title,
        descr: created.descr,
        itemCount: 1,
        center: expect.objectContaining({
          id: expect.any(String),
          name: created.title,
          descr: created.descr,
          coords: created.center.coords,
        }),
      });
    });

    it("should throw an error for non-existent map ID", async () => {
      // Use service from testEnv
      await expect(testEnv.service.getOne("999")).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("should get multiple maps with pagination", async () => {
      // Use service from testEnv
      const map1 = await testEnv.service.create({
        ownerId: "1",
        title: "Map 1",
      });
      const map2 = await testEnv.service.create({
        ownerId: "1",
        title: "Map 2",
      });
      const map3 = await testEnv.service.create({
        ownerId: "1",
        title: "Map 3",
      });

      const maps = await testEnv.service.getMany(2, 0);
      expect(maps).toHaveLength(2);
      expect(maps[0]?.id).toBe(map1.id);
      expect(maps[1]?.id).toBe(map2.id);

      const mapsWithOffset = await testEnv.service.getMany(2, 1);
      expect(mapsWithOffset).toHaveLength(2);
      expect(mapsWithOffset[0]?.id).toBe(map2.id);
      expect(mapsWithOffset[1]?.id).toBe(map3.id);
    });

    it("should use default pagination values", async () => {
      // Use service from testEnv
      await testEnv.service.create({ ownerId: "1", title: "Map 1" });
      await testEnv.service.create({ ownerId: "1", title: "Map 2" });

      const maps = await testEnv.service.getMany();
      expect(maps.length).toBe(2);
    });
  });

  describe("getByOwnerId", () => {
    it("should get maps by owner ID", async () => {
      // Use service from testEnv
      const map1 = await testEnv.service.create({
        ownerId: "1",
        title: "Owner 1 Map",
      });
      const map2 = await testEnv.service.create({
        ownerId: "1",
        title: "Owner 1 Map",
      });
      await testEnv.service.create({ ownerId: "2", title: "Owner 2 Map" });
      const ownerMaps = await testEnv.service.getByOwnerId("1");
      expect(ownerMaps).toHaveLength(2);
      // Verify IDs exist, regardless of order
      expect(ownerMaps.map((m) => m.id).sort()).toEqual(
        [map1.id, map2.id].sort(),
      );
    });

    it("should return empty array for non-existent owner", async () => {
      // Use service from testEnv
      const maps = await testEnv.service.getByOwnerId("999");
      expect(maps).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("should update map title and description", async () => {
      // Use service from testEnv
      const created = await testEnv.service.create({
        title: "Test HexMap",
        descr: "Test Description",
        ownerId: "1",
      });

      const updateArgs = {
        mapId: created.id,
        title: "Updated HexMap",
        descr: "Updated Description",
      };

      const updated = await testEnv.service.update(updateArgs);

      expect(updated.title).toBe(updateArgs.title);
      expect(updated.descr).toBe(updateArgs.descr);
      expect(updated.center.name).toBe(updateArgs.title);
      expect(updated.center.descr).toBe(updateArgs.descr);
    });
  });

  describe("remove", () => {
    it("should remove a map", async () => {
      // Use service from testEnv
      const created = await testEnv.service.create({
        title: "Test HexMap",
        ownerId: "1",
      });

      await testEnv.service.remove(created.id);

      // Verify the map can't be retrieved
      await expect(testEnv.service.getOne(created.id)).rejects.toThrow();
    });

    it("should handle removing a non-existent map gracefully", async () => {
      // Use a non-existent ID
      const nonExistentId = "non-existent-map-id-999";
      try {
        await testEnv.service.remove(nonExistentId);
        // If it resolves, it's okay (idempotent for some repos)
      } catch (error) {
        // If it throws, that's acceptable too (for other repos)
        expect(error).toBeInstanceOf(Error);
      }
      // Crucially, verify it doesn't exist after the attempt
      await expect(testEnv.service.getOne(nonExistentId)).rejects.toThrow();
    });
  });

  describe("addItem", () => {
    it("should add an item to a map", async () => {
      // Use service from testEnv
      const map = await testEnv.service.create({
        title: "Test HexMap",
        ownerId: "1",
      });

      const addItemArgs = {
        mapId: String(map.id),
        coords: { row: 0, col: 0, path: [HexDirection.NorthEast] },
        title: "Child Item",
        descr: "Child Description",
      };
      await testEnv.service.addItem(addItemArgs);
      const items = await testEnv.service.getItems({ mapId: map.id });
      expect(items).toHaveLength(2);
      expect(items[1]?.name).toBe("Child Item");
      expect(items[1]?.mapId).toBe(map.id);
      expect(items[1]).toMatchObject({
        id: expect.any(String),
        name: "Child Item",
        descr: "Child Description",
        coords: expect.any(String),
        color: expect.any(String),
      });
    });

    // New test case to verify parentId
    it("should set the correct parentId when adding an item", async () => {
      // Arrange: Create a map (which includes a center item)
      const map = await testEnv.service.create({
        title: "Parent Test Map",
        ownerId: "1",
      });
      const centerItemId = map.center.id; // Get the ID of the default center item

      // Act: Add a new item, implicitly making the center item its parent
      const addItemArgs = {
        mapId: String(map.id),
        coords: { row: 0, col: 0, path: [HexDirection.SouthEast] }, // Corrected direction
        title: "Child Item For Parent Test",
      };
      await testEnv.service.addItem(addItemArgs);

      // Assert: Retrieve the items via the service and check the parentId
      const items = await testEnv.service.getItems({ mapId: map.id });
      expect(items).toHaveLength(2); // Center + New Item

      // Find the newly added item
      const newItem = items.find((item) => item.name === addItemArgs.title);
      expect(newItem).toBeDefined();

      // Assert directly on the item contract returned by the service
      expect(newItem!.parentId).toBe(centerItemId);
    });

    it("should throw an error when adding an item at occupied coords", async () => {
      // Use service from testEnv
      const map = await testEnv.service.create({
        title: "Test HexMap",
        ownerId: "1",
      });

      const coords = { row: 0, col: 0, path: [HexDirection.NorthEast] };

      // Add first item
      await testEnv.service.addItem({
        mapId: String(map.id),
        coords,
        title: "First Item",
      });

      // Try to add second item at same coords
      await expect(
        testEnv.service.addItem({
          mapId: String(map.id),
          coords,
          title: "Second Item",
        }),
        // Allow for different repo error messages (DB vs Memory)
      ).rejects.toThrow(/already exists at these coords|unique constraint/i);
    });
  });

  describe("removeItem", () => {
    it("should remove an item from a map", async () => {
      const map = await testEnv.service.create({
        title: "Test HexMap",
        ownerId: "1",
      });

      const addItemArgs = {
        mapId: String(map.id),
        coords: { row: 0, col: 0, path: [HexDirection.NorthEast] },
        title: "Child Item",
        descr: "Child Description",
      };
      await testEnv.service.addItem(addItemArgs);
      const items = await testEnv.service.getItems({ mapId: map.id });
      expect(items).toHaveLength(2);
      // We know there should be at least 2 items - center + added item
      expect(items.length).toBeGreaterThan(1);

      // The test should fail if we don't have a second item, so this is safe
      const itemToRemove = items[1]!;

      // Use the coordinates (not a numeric ID) from the item
      await testEnv.service.removeItem({
        itemId: itemToRemove.coords,
        mapId: map.id,
      });
      const m2 = await testEnv.service.getItems({ mapId: map.id });
      expect(m2).toHaveLength(1);
      expect(m2[0]?.id).not.toBe(itemToRemove.id);
    });
  });

  describe("getItem", () => {
    it("should get a map item by coordinates", async () => {
      // Create a map
      const map = await testEnv.service.create({
        title: "Test HexMap",
        ownerId: "1",
      });

      // Add an item to the map
      const coords = { row: 0, col: 0, path: [HexDirection.NorthEast] };
      const itemTitle = "Test Item";
      const itemDescr = "Test Description";

      await testEnv.service.addItem({
        mapId: map.id,
        coords,
        title: itemTitle,
        descr: itemDescr,
      });

      // Get the item using getItem method
      const retrievedItem = await testEnv.service.getItem({
        mapId: map.id,
        coords,
      });

      // Verify the returned item has the expected properties
      expect(retrievedItem).toBeDefined();
      expect(retrievedItem.name).toBe(itemTitle);
      expect(retrievedItem.descr).toBe(itemDescr);
      expect(retrievedItem.mapId).toBe(map.id);
      expect(retrievedItem.coords).toBe("0,0:2"); // NorthEast coordinate string
    });

    it("should throw an error when item not found", async () => {
      // Create a map
      const map = await testEnv.service.create({
        title: "Test HexMap",
        ownerId: "1",
      });

      // Try to get a non-existent item
      const nonExistentCoords = {
        row: 9,
        col: 9,
        path: [HexDirection.SouthWest],
      };

      await expect(
        testEnv.service.getItem({
          mapId: map.id,
          coords: nonExistentCoords,
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("moveMapItem", () => {
    it("should move a map item to an empty location with the same parent", async () => {
      // Setup test environment with map and child item
      const { map, childItem } = await setupSingleItemTest();

      // Define the new coordinates to move to
      const newCoords = "0,0:3"; // East

      // Move the child item to a new location
      await testEnv.service.moveMapItem({
        mapId: map.id,
        oldCoords: HexCoordSystem.parseId(childItem.coords),
        newCoords: HexCoordSystem.parseId(newCoords),
      });

      // Verify the item was moved correctly
      await verifyItemMoved(map.id, childItem, newCoords);
    });

    it("should swap items when moving to an occupied location", async () => {
      // Setup test environment with map and two items
      const { map, firstItem, secondItem } = await setupSwapTest();

      // Execute the swap operation
      await testEnv.service.moveMapItem({
        mapId: map.id,
        oldCoords: HexCoordSystem.parseId(firstItem.coords),
        newCoords: HexCoordSystem.parseId(secondItem.coords),
      });

      // Verify positions were swapped correctly
      await verifyItemsSwapped(map.id, firstItem, secondItem);
    });

    it("should swap items and their parents when moving to an occupied location with different parent", async () => {
      // Setup test environment with nested items structure
      const { map, firstParent, firstChild, secondParent, secondChild } =
        await setupNestedItemsTest();

      // Execute the swap operation
      await testEnv.service.moveMapItem({
        mapId: map.id,
        oldCoords: HexCoordSystem.parseId(firstChild.coords),
        newCoords: HexCoordSystem.parseId(secondChild.coords),
      });

      // Verify positions and parents were swapped correctly
      await verifyNestedItemsSwapped(
        map,
        firstParent,
        firstChild,
        secondParent,
        secondChild,
      );
    });

    it("should throw error when trying to move a non-existent item", async () => {
      // Create a map
      const { map } = await setupSingleItemTest();

      // Try to move a non-existent item
      await expect(
        testEnv.service.moveMapItem({
          mapId: map.id,
          oldCoords: { row: 9, col: 9, path: [HexDirection.NorthEast] }, // Non-existent coordinates
          newCoords: { row: 0, col: 0, path: [HexDirection.East] },
        }),
      ).rejects.toThrow(/not found/);
    });

    it("should move a map item to a location with a different parent", async () => {
      // Setup test environment with nested items structure
      const { map, firstChild, secondChild } = await setupNestedItemsTest();

      // Execute the move operation
      await testEnv.service.moveMapItem({
        mapId: map.id,
        oldCoords: HexCoordSystem.parseId(firstChild.coords),
        newCoords: HexCoordSystem.parseId(secondChild.coords),
      });

      // Verify the item was moved correctly
      await verifyItemMoved(map.id, firstChild, secondChild.coords);
    });

    it("should throw error when trying to move the center item", async () => {
      // Create a map
      const { map } = await setupSingleItemTest();

      // Try to move the center item
      await expect(
        testEnv.service.moveMapItem({
          mapId: map.id,
          oldCoords: { row: 0, col: 0, path: [] }, // Center coordinates
          newCoords: { row: 0, col: 0, path: [HexDirection.East] },
        }),
      ).rejects.toThrow(MAPPING_ERRORS.CENTER_ITEM_NOT_ALLOWED);
    });

    it("should update coordinates of all descendants when moving a parent item", async () => {
      // Create a map
      const map = await testEnv.service.create({
        title: "Descendants Test Map",
        ownerId: "1",
      });

      // Add a parent item
      await testEnv.service.addItem({
        mapId: map.id,
        coords: { row: 0, col: 0, path: [HexDirection.NorthEast] },
        title: "Parent Item",
      });

      // Add a child to the parent
      await testEnv.service.addItem({
        mapId: map.id,
        coords: {
          row: 0,
          col: 0,
          path: [HexDirection.NorthEast, HexDirection.East],
        },
        title: "Child Item",
      });

      // Add a grandchild
      await testEnv.service.addItem({
        mapId: map.id,
        coords: {
          row: 0,
          col: 0,
          path: [
            HexDirection.NorthEast,
            HexDirection.East,
            HexDirection.SouthEast,
          ],
        },
        title: "Grandchild Item",
      });

      // Get all items to verify initial state
      const initialItems = await testEnv.service.getItems({ mapId: map.id });
      const parentItem = initialItems.find(
        (item) => item.name === "Parent Item",
      )!;
      const childItem = initialItems.find(
        (item) => item.name === "Child Item",
      )!;
      const grandchildItem = initialItems.find(
        (item) => item.name === "Grandchild Item",
      )!;

      // Verify initial coordinates
      expect(parentItem.coords).toBe("0,0:2"); // NorthEast
      expect(childItem.coords).toBe("0,0:2,3"); // NorthEast, East
      expect(grandchildItem.coords).toBe("0,0:2,3,4"); // NorthEast, East, SouthEast

      // Move the parent to a new location
      const newParentCoords = {
        row: 0,
        col: 0,
        path: [HexDirection.SouthWest],
      };
      await testEnv.service.moveMapItem({
        mapId: map.id,
        oldCoords: HexCoordSystem.parseId(parentItem.coords),
        newCoords: newParentCoords,
      });

      // Get updated items
      const updatedItems = await testEnv.service.getItems({ mapId: map.id });
      const updatedParent = updatedItems.find(
        (item) => item.name === "Parent Item",
      )!;
      const updatedChild = updatedItems.find(
        (item) => item.name === "Child Item",
      )!;
      const updatedGrandchild = updatedItems.find(
        (item) => item.name === "Grandchild Item",
      )!;

      // Verify new coordinates
      expect(updatedParent.coords).toBe("0,0:5"); // SouthWest
      expect(updatedChild.coords).toBe("0,0:5,3"); // SouthWest, East
      expect(updatedGrandchild.coords).toBe("0,0:5,3,4"); // SouthWest, East, SouthEast

      // Verify path structure is maintained but with new parent path
      const parentPath = HexCoordSystem.parseId(updatedParent.coords).path;
      const childPath = HexCoordSystem.parseId(updatedChild.coords).path;
      const grandchildPath = HexCoordSystem.parseId(
        updatedGrandchild.coords,
      ).path;

      // Check that the paths maintain their structure
      expect(parentPath).toEqual([HexDirection.SouthWest]);
      expect(childPath).toEqual([HexDirection.SouthWest, HexDirection.East]);
      expect(grandchildPath).toEqual([
        HexDirection.SouthWest,
        HexDirection.East,
        HexDirection.SouthEast,
      ]);

      // Verify child's parent ID is still the parent
      expect(updatedChild.parentId).toBe(updatedParent.id);

      // Verify grandchild's parent ID is still the child
      expect(updatedGrandchild.parentId).toBe(updatedChild.id);
    });
  });

  // Setup function that creates map and single child item
  async function setupSingleItemTest() {
    const map = await testEnv.service.create({
      title: "Test HexMap",
      ownerId: "1",
    });

    // Add a child item
    await testEnv.service.addItem({
      mapId: map.id,
      coords: { row: 0, col: 0, path: [HexDirection.NorthEast] },
      title: "Child Item",
    });

    // Get the created item
    const items = await testEnv.service.getItems({ mapId: map.id });
    const childItem = items.find((item) => item.name === "Child Item")!;

    return { map, childItem };
  }

  // Setup function that creates map and two items
  async function setupSwapTest() {
    const map = await testEnv.service.create({
      title: "Test HexMap",
      ownerId: "1",
    });

    // Create two items at specific positions
    await testEnv.service.addItem({
      mapId: map.id,
      coords: { row: 0, col: 0, path: [HexDirection.NorthEast] },
      title: "First Child",
    });

    await testEnv.service.addItem({
      mapId: map.id,
      coords: { row: 0, col: 0, path: [HexDirection.East] },
      title: "Second Child",
    });

    // Get the created items
    const items = await testEnv.service.getItems({ mapId: map.id });
    const firstItem = items.find((item) => item.name === "First Child")!;
    const secondItem = items.find((item) => item.name === "Second Child")!;

    return { map, firstItem, secondItem };
  }

  // Setup function that creates map with nested items structure
  async function setupNestedItemsTest() {
    const map = await testEnv.service.create({
      title: "Test HexMap",
      ownerId: "1",
    });

    // Add a child item (first parent)
    await testEnv.service.addItem({
      mapId: map.id,
      coords: { row: 0, col: 0, path: [HexDirection.NorthEast] },
      title: "First Parent",
    });

    // Add a grandchild under the first parent
    await testEnv.service.addItem({
      mapId: map.id,
      coords: {
        row: 0,
        col: 0,
        path: [HexDirection.NorthEast, HexDirection.East],
      },
      title: "Child of First Parent",
    });

    // Add another child item (second parent)
    await testEnv.service.addItem({
      mapId: map.id,
      coords: { row: 0, col: 0, path: [HexDirection.East] },
      title: "Second Parent",
    });

    // Add a grandchild under the second parent
    await testEnv.service.addItem({
      mapId: map.id,
      coords: {
        row: 0,
        col: 0,
        path: [HexDirection.East, HexDirection.NorthEast],
      },
      title: "Child of Second Parent",
    });

    // Get all items
    const items = await testEnv.service.getItems({ mapId: map.id });

    // Find specific items by name
    const firstParent = items.find((item) => item.name === "First Parent")!;
    const firstChild = items.find(
      (item) => item.name === "Child of First Parent",
    )!;
    const secondParent = items.find((item) => item.name === "Second Parent")!;
    const secondChild = items.find(
      (item) => item.name === "Child of Second Parent",
    )!;

    return { map, firstParent, firstChild, secondParent, secondChild };
  }

  // Verify that the item has been moved to the new location
  async function verifyItemMoved(
    mapId: string,
    originalItem: MapItemContract,
    expectedNewCoords: string,
  ) {
    const items = await testEnv.service.getItems({ mapId });

    // Find the moved item by its title
    const movedItem = items.find((item) => item.name === originalItem.name);

    // Verify it exists and has the new coordinates
    expect(movedItem).toBeDefined();
    expect(movedItem?.coords).toBe(expectedNewCoords);
  }

  // Verify that the items have been swapped
  async function verifyItemsSwapped(
    mapId: string,
    originalFirstItem: MapItemContract,
    originalSecondItem: MapItemContract,
  ) {
    const items = await testEnv.service.getItems({ mapId });

    // Find items by their titles
    const firstItem = items.find(
      (item) => item.name === originalFirstItem.name,
    );
    const secondItem = items.find(
      (item) => item.name === originalSecondItem.name,
    );

    // Verify both items exist
    expect(firstItem).toBeDefined();
    expect(secondItem).toBeDefined();

    // Verify they've swapped positions
    expect(firstItem?.coords).toBe(originalSecondItem.coords);
    expect(secondItem?.coords).toBe(originalFirstItem.coords);
  }

  // Verify that nested items have been swapped correctly including parent relationships
  async function verifyNestedItemsSwapped(
    map: MapContract,
    firstParent: MapItemContract,
    firstChild: MapItemContract,
    secondParent: MapItemContract,
    secondChild: MapItemContract,
  ) {
    const items = await testEnv.service.getItems({ mapId: map.id });

    // Find the swapped items by their titles
    const firstChildAfterSwap = items.find(
      (item) => item.name === firstChild.name,
    );
    const secondChildAfterSwap = items.find(
      (item) => item.name === secondChild.name,
    );

    // Verify items exist
    expect(firstChildAfterSwap).toBeDefined();
    expect(secondChildAfterSwap).toBeDefined();

    // Verify they've swapped positions
    expect(firstChildAfterSwap?.coords).toBe(secondChild.coords);
    expect(secondChildAfterSwap?.coords).toBe(firstChild.coords);

    // Verify parent IDs have been updated
    expect(firstChildAfterSwap?.parentId).toBe(secondParent.id);
    expect(secondChildAfterSwap?.parentId).toBe(firstParent.id);
  }

  describe("getDescendants", () => {
    it("should return descendants of an item", async () => {
      // Create a map with a hierarchy of items
      const map = await testEnv.service.create({
        title: "Test HexMap",
        ownerId: "1",
      });

      // Add a child item to the center
      const northEastCoords = {
        row: 0,
        col: 0,
        path: [HexDirection.NorthEast],
      };
      await testEnv.service.addItem({
        mapId: map.id,
        coords: northEastCoords,
        title: "Child Item",
      });

      // Add a grandchild to the child item
      const grandchildCoords = {
        row: 0,
        col: 0,
        path: [HexDirection.NorthEast, HexDirection.East],
      };
      await testEnv.service.addItem({
        mapId: map.id,
        coords: grandchildCoords,
        title: "Grandchild Item",
      });

      // Add another item that is not a descendant
      await testEnv.service.addItem({
        mapId: map.id,
        coords: { row: 0, col: 0, path: [HexDirection.East] },
        title: "Unrelated Item",
      });

      // Get all items to verify setup
      const allItems = await testEnv.service.getItems({ mapId: map.id });
      expect(allItems.length).toBe(4); // Center + 3 added items

      // Get descendants of the center
      const centerCoordStr = "0,0";
      const centerDescendants = await testEnv.service.getDescendants({
        mapId: map.id,
        itemId: centerCoordStr,
      });
      expect(centerDescendants.length).toBe(3); // All 3 added items are descendants of center

      // Get descendants of the north-east child
      const childCoordStr = "0,0:2"; // NorthEast = 2
      const childDescendants = await testEnv.service.getDescendants({
        mapId: map.id,
        itemId: childCoordStr,
      });
      expect(childDescendants.length).toBe(1); // Only the grandchild
      expect(childDescendants[0]!.name).toBe("Grandchild Item");

      // Item with no descendants should return empty array
      const grandchildCoordStr = "0,0:2,3"; // NorthEast:East = 2,3
      const noDescendants = await testEnv.service.getDescendants({
        mapId: map.id,
        itemId: grandchildCoordStr,
      });
      expect(noDescendants.length).toBe(0);
    });
  });
});
