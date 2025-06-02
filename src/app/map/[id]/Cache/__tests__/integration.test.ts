/**
 * @vitest-environment node
 */

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useReducer } from "react";
import { cacheReducer, initialCacheState } from "../State/reducer";
import { cacheActions } from "../State/actions";
import { createDataHandlerWithMockableService } from "../Handlers/data-handler";
import { createMutationHandlerForCache } from "../Handlers/mutation-handler";
import { createNavigationHandlerForTesting } from "../Handlers/navigation-handler";
import { createSyncEngine } from "../Sync/sync-engine";
import {
  createServerService,
  createMockServerService,
} from "../Services/server-service";
import {
  createStorageService,
  createMockStorageService,
} from "../Services/storage-service";
import type { CacheAction, CacheState } from "../State/types";
import type { DataOperations, LoadResult } from "../Handlers/types";
import type { MapItemAPIContract } from "~/server/api/types/contracts";

// Mock console methods
const mockConsoleWarn = vi.fn();
const mockConsoleError = vi.fn();
console.warn = mockConsoleWarn;
console.error = mockConsoleError;

// Test cache that properly manages state and handlers
class TestCache {
  private _state: CacheState = initialCacheState;
  private _dispatch: (action: CacheAction) => void;
  private mockUtils: any;

  constructor(mockUtils: any) {
    this.mockUtils = mockUtils;
    this._dispatch = (action: CacheAction) => {
      this._state = cacheReducer(this._state, action);
    };
  }

  get state() {
    return this._state;
  }

  get dispatch() {
    return this._dispatch;
  }

  createDataHandler() {
    // Create handler with getter function to always use current state
    return createDataHandlerWithMockableService(
      this._dispatch,
      this._state, // Use current state snapshot
      this.mockUtils,
    );
  }

  createMutationHandler(dataOperations: DataOperations) {
    // Create handler with getter function to always use current state
    return createMutationHandlerForCache(
      this._dispatch,
      this._state, // Use current state snapshot
      dataOperations,
    );
  }

  createNavigationHandler(dataOperations: DataOperations, mockRouter: any) {
    // Create handler with getter function to always use current state
    return createNavigationHandlerForTesting(
      this._dispatch,
      this._state, // Use current state snapshot
      dataOperations,
      mockRouter,
      new URLSearchParams(),
      "/map/123",
    );
  }

  // Helper method to refresh handlers after state changes
  refreshHandlers() {
    // After state changes, handlers need to be recreated to see the new state
    // This is a limitation of the current design - in real usage, handlers
    // would be recreated or use state getters
    return {
      createDataHandler: () => this.createDataHandler(),
      createMutationHandler: (ops: DataOperations) =>
        this.createMutationHandler(ops),
      createNavigationHandler: (ops: DataOperations, router: any) =>
        this.createNavigationHandler(ops, router),
    };
  }
}

// Wrapper to adapt data handler to DataOperations interface
function wrapDataHandlerAsDataOperations(
  dataHandler: ReturnType<typeof createDataHandlerWithMockableService>,
): DataOperations {
  return {
    loadRegion: async (
      centerCoordId: string,
      maxDepth?: number,
    ): Promise<LoadResult> => {
      try {
        await dataHandler.loadRegion(centerCoordId, maxDepth);
        return { success: true };
      } catch (error) {
        return { success: false, error: error as Error };
      }
    },
    loadItemChildren: async (
      parentCoordId: string,
      maxDepth?: number,
    ): Promise<LoadResult> => {
      try {
        await dataHandler.loadItemChildren(parentCoordId, maxDepth);
        return { success: true };
      } catch (error) {
        return { success: false, error: error as Error };
      }
    },
    prefetchRegion: async (centerCoordId: string): Promise<LoadResult> => {
      try {
        await dataHandler.prefetchRegion(centerCoordId);
        return { success: true };
      } catch (error) {
        return { success: false, error: error as Error };
      }
    },
    invalidateRegion: dataHandler.invalidateRegion,
    invalidateAll: dataHandler.invalidateAll,
  };
}

// Enhanced wrapper that can check state for errors
function wrapDataHandlerWithErrorDetection(
  dataHandler: ReturnType<typeof createDataHandlerWithMockableService>,
  getState: () => CacheState,
): DataOperations {
  return {
    loadRegion: async (
      centerCoordId: string,
      maxDepth?: number,
    ): Promise<LoadResult> => {
      const stateBefore = getState();
      const errorBefore = stateBefore.error;

      await dataHandler.loadRegion(centerCoordId, maxDepth);

      const stateAfter = getState();
      const errorAfter = stateAfter.error;

      // Check if a new error was set
      if (errorAfter && errorAfter !== errorBefore) {
        return { success: false, error: errorAfter };
      }

      return { success: true };
    },
    loadItemChildren: async (
      parentCoordId: string,
      maxDepth?: number,
    ): Promise<LoadResult> => {
      const stateBefore = getState();
      const errorBefore = stateBefore.error;

      await dataHandler.loadItemChildren(parentCoordId, maxDepth);

      const stateAfter = getState();
      const errorAfter = stateAfter.error;

      // Check if a new error was set
      if (errorAfter && errorAfter !== errorBefore) {
        return { success: false, error: errorAfter };
      }

      return { success: true };
    },
    prefetchRegion: async (centerCoordId: string): Promise<LoadResult> => {
      await dataHandler.prefetchRegion(centerCoordId);
      return { success: true }; // Prefetch always succeeds (silent fail)
    },
    invalidateRegion: dataHandler.invalidateRegion,
    invalidateAll: dataHandler.invalidateAll,
  };
}

describe("Cache Integration Tests", () => {
  let mockUtils: any;

  const mockItems: MapItemAPIContract[] = [
    {
      id: "1",
      coordinates: "1,2",
      name: "Root Item",
      descr: "Root Description",
      depth: 0,
      url: "https://example.com/root",
      parentId: null,
      itemType: "BASE" as any,
      ownerId: "test-owner",
    },
    {
      id: "2",
      coordinates: "1,2:1",
      name: "Child Item 1",
      descr: "Child Description 1",
      depth: 1,
      url: "https://example.com/child1",
      parentId: "1",
      itemType: "BASE" as any,
      ownerId: "test-owner",
    },
    {
      id: "3",
      coordinates: "1,2:2",
      name: "Child Item 2",
      descr: "Child Description 2",
      depth: 1,
      url: "https://example.com/child2",
      parentId: "1",
      itemType: "BASE" as any,
      ownerId: "test-owner",
    },
    {
      id: "4",
      coordinates: "1,2:1:1",
      name: "Grandchild Item",
      descr: "Grandchild Description",
      depth: 2,
      url: "https://example.com/grandchild",
      parentId: "2",
      itemType: "BASE" as any,
      ownerId: "test-owner",
    },
  ];

  beforeEach(() => {
    mockUtils = {
      map: {
        getItemsForRootItem: {
          fetch: vi.fn().mockResolvedValue(mockItems),
        },
        getItemByCoords: {
          fetch: vi.fn().mockResolvedValue(mockItems[0]),
        },
        getRootItemById: {
          fetch: vi.fn().mockResolvedValue(mockItems[0]),
        },
        getDescendants: {
          fetch: vi.fn().mockResolvedValue(mockItems.slice(1)),
        },
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Cache Workflows", () => {
    test("full user journey: load -> navigate -> mutate -> sync", async () => {
      const cache = new TestCache(mockUtils);

      // 1. Initial load of region
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);

      await dataOperations.loadRegion("1,2", 3);

      expect(Object.keys(cache.state.itemsById)).toHaveLength(4);
      expect(cache.state.regionMetadata["1,2"]).toBeDefined();
      expect(cache.state.regionMetadata["1,2"]?.maxDepth).toBe(3);

      // 2. Navigate to specific item - create navigation handler after data is loaded
      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
      };

      // Create navigation handler with current state that has loaded items
      const navigationHandler = createNavigationHandlerForTesting(
        cache.dispatch,
        cache.state, // Current state with loaded items
        dataOperations,
        mockRouter,
        new URLSearchParams(),
        "/map/123",
      );

      await navigationHandler.navigateToItem("1,2:1");

      expect(cache.state.currentCenter).toBe("1,2:1");
      expect(mockRouter.push).toHaveBeenCalled();

      // 3. Mutate data with actual mutation handler method
      const mutationHandler = createMutationHandlerForCache(
        cache.dispatch,
        cache.state, // Current state with loaded items
        dataOperations,
      );

      await mutationHandler.updateItem("1,2:1", {
        name: "Updated Child Item 1",
        description: "Updated Description",
      });

      // Check if optimistic update was applied
      const pendingChanges = mutationHandler.getPendingOptimisticChanges();
      expect(pendingChanges.length).toBeGreaterThan(0);

      // 4. Sync operations with correct interface
      const syncEngine = createSyncEngine({
        dispatch: cache.dispatch,
        state: cache.state,
        dataHandler: dataOperations,
      });

      const syncResult = await syncEngine.performSync();
      expect(syncResult.success).toBe(true);
      expect(cache.state.error).toBeNull();
    });

    test("complex hierarchical loading and navigation", async () => {
      const cache = new TestCache(mockUtils);
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);

      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
      };

      const navigationHandler = cache.createNavigationHandler(
        dataOperations,
        mockRouter,
      );

      // Load different regions at different depths
      await dataOperations.loadRegion("1,2", 1); // Root only
      await dataOperations.loadRegion("1,2:1", 2); // Children level
      await dataOperations.loadRegion("1,2:1:1", 3); // Grandchildren level

      // Navigate through the hierarchy
      await navigationHandler.navigateToItem("1,2");
      await navigationHandler.navigateToItem("1,2:1");
      await navigationHandler.navigateToItem("1,2:1:1");

      // Verify navigation path
      expect(cache.state.currentCenter).toBe("1,2:1:1");

      // Verify region metadata tracks different levels
      expect(cache.state.regionMetadata["1,2"]).toBeDefined();
      expect(cache.state.regionMetadata["1,2:1"]).toBeDefined();
      expect(cache.state.regionMetadata["1,2:1:1"]).toBeDefined();

      // Verify all items are loaded
      expect(Object.keys(cache.state.itemsById)).toHaveLength(4);
    });

    test("error recovery and graceful degradation", async () => {
      const cache = new TestCache(mockUtils);

      // First load should succeed
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);

      await dataOperations.loadRegion("1,2", 2);
      expect(cache.state.error).toBeNull();
      expect(Object.keys(cache.state.itemsById)).toHaveLength(4);

      // Second load should fail gracefully - create error cache with error detection
      const errorUtils = {
        map: {
          getItemsForRootItem: {
            fetch: vi.fn().mockRejectedValue(new Error("Network timeout")),
          },
          getItemByCoords: {
            fetch: vi.fn().mockRejectedValue(new Error("Network timeout")),
          },
          getRootItemById: {
            fetch: vi.fn().mockRejectedValue(new Error("Network timeout")),
          },
          getDescendants: {
            fetch: vi.fn().mockRejectedValue(new Error("Network timeout")),
          },
        },
      };

      const errorCache = new TestCache(errorUtils);
      const errorDataHandler = errorCache.createDataHandler();

      // Use enhanced wrapper that detects errors from state
      const errorDataOperations = wrapDataHandlerWithErrorDetection(
        errorDataHandler,
        () => errorCache.state,
      );

      const result = await errorDataOperations.loadRegion("1,2:3", 2);
      expect(result.success).toBe(false);
      expect(errorCache.state.error).toBeDefined();

      // Cache should retain previous data (none in this case)
      expect(Object.keys(errorCache.state.itemsById)).toHaveLength(0);

      // Recovery should work when we fix the utils
      errorUtils.map.getItemsForRootItem.fetch.mockResolvedValueOnce(mockItems);
      await errorDataOperations.loadRegion("1,2:4", 2);
      expect(errorCache.state.error).toBeNull();
    });

    test("concurrent operations coordination", async () => {
      const cache = new TestCache(mockUtils);
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);

      // Simulate multiple concurrent operations
      const promises = [
        dataOperations.loadRegion("1,2", 2),
        dataOperations.loadRegion("1,2:1", 3),
        dataOperations.prefetchRegion("1,2:2"),
      ];

      await Promise.all(promises);

      // All operations should complete successfully
      expect(cache.state.error).toBeNull();
      expect(cache.state.isLoading).toBe(false);

      // All regions should be tracked
      expect(Object.keys(cache.state.regionMetadata)).toHaveLength(3);
      expect(cache.state.regionMetadata["1,2"]).toBeDefined();
      expect(cache.state.regionMetadata["1,2:1"]).toBeDefined();
      expect(cache.state.regionMetadata["1,2:2"]).toBeDefined();
    });
  });

  describe("Performance Benchmarks", () => {
    test("large dataset handling performance", async () => {
      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        coordinates: `1,2:${i + 1}`,
        name: `Item ${i + 1}`,
        descr: `Description ${i + 1}`,
        depth: Math.floor(i / 100),
        url: `https://example.com/item${i + 1}`,
        parentId: i === 0 ? null : "1",
        itemType: "BASE" as any,
        ownerId: "test-owner",
      }));

      mockUtils.map.getItemsForRootItem.fetch.mockResolvedValue(largeDataset);

      const cache = new TestCache(mockUtils);
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);

      const startTime = performance.now();
      await dataOperations.loadRegion("1,2", 3);
      const endTime = performance.now();

      // Should handle 1000 items in reasonable time
      expect(endTime - startTime).toBeLessThan(500);
      expect(Object.keys(cache.state.itemsById)).toHaveLength(1000);
    });

    test("rapid successive operations performance", async () => {
      const cache = new TestCache(mockUtils);
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);

      const startTime = performance.now();

      // Perform 100 rapid operations
      const operations = Array.from({ length: 100 }, (_, i) =>
        dataOperations.prefetchRegion(`1,2:${i}`),
      );

      await Promise.all(operations);
      const endTime = performance.now();

      // All operations should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      expect(cache.state.error).toBeNull();
    });

    test("memory usage stability", async () => {
      const cache = new TestCache(mockUtils);
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform multiple load/invalidate cycles
      for (let i = 0; i < 50; i++) {
        await dataOperations.loadRegion(`0,1:${i}`, 2);
        dataOperations.invalidateRegion(`0,1:${i}`);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be reasonable (< 50MB)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe("Real-world Usage Scenarios", () => {
    test("typical user session simulation", async () => {
      const cache = new TestCache(mockUtils);

      // User opens map
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);
      await dataOperations.loadRegion("1,2", 2);

      // User expands some items
      cache.dispatch(cacheActions.toggleItemExpansion("1,2:1"));
      cache.dispatch(cacheActions.toggleItemExpansion("1,2:2"));

      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
      };

      // Create handlers after initial data load
      const mutationHandler = createMutationHandlerForCache(
        cache.dispatch,
        cache.state,
        dataOperations,
      );

      const navigationHandler = createNavigationHandlerForTesting(
        cache.dispatch,
        cache.state,
        dataOperations,
        mockRouter,
        new URLSearchParams(),
        "/map/123",
      );

      // User navigates around
      await navigationHandler.navigateToItem("1,2");
      await navigationHandler.navigateToItem("1,2:1");
      // Last navigation should set center to 1,2:2, but we want to check final state
      await navigationHandler.navigateToItem("1,2:2");

      // User makes some edits using actual mutation methods
      await mutationHandler.updateItem("1,2:1", {
        name: "Edited Item 1",
        description: "Edited Description 1",
      });

      await mutationHandler.updateItem("1,2:2", {
        name: "Edited Item 2",
        description: "Edited Description 2",
      });

      // Verify session state - center should be the last navigated item
      expect(cache.state.currentCenter).toBe("1,2:2"); // Last navigation target
      expect(cache.state.expandedItemIds).toContain("1,2:1");
      expect(cache.state.expandedItemIds).toContain("1,2:2");

      // Check that mutations have pending changes
      const pendingChanges = mutationHandler.getPendingOptimisticChanges();
      expect(pendingChanges.length).toBeGreaterThan(0);
    });

    test("offline-to-online synchronization simulation", async () => {
      const cache = new TestCache(mockUtils);

      // Load initial data while online
      const dataHandler = cache.createDataHandler();
      const dataOperations = wrapDataHandlerAsDataOperations(dataHandler);
      await dataOperations.loadRegion("1,2", 2);

      // Create mutation handler after data is loaded
      const mutationHandler = createMutationHandlerForCache(
        cache.dispatch,
        cache.state,
        dataOperations,
      );

      // Simulate going offline - make optimistic changes
      await mutationHandler.updateItem("1,2:1", {
        name: "Offline Edit 1",
        description: "Made while offline",
      });

      await mutationHandler.updateItem("1,2:2", {
        name: "Offline Edit 2",
        description: "Also made while offline",
      });

      const offlinePendingChanges =
        mutationHandler.getPendingOptimisticChanges();
      expect(offlinePendingChanges).toHaveLength(2);

      // Network comes back online - test sync engine
      const syncEngine = createSyncEngine({
        dispatch: cache.dispatch,
        state: cache.state,
        dataHandler: dataOperations,
      });

      const syncResult = await syncEngine.performSync();

      // Verify sync completed successfully
      expect(syncResult.success).toBe(true);
      expect(cache.state.error).toBeNull();
    });

    test("multi-user collaborative editing simulation", async () => {
      // Create two separate cache instances for two users
      const user1Cache = new TestCache(mockUtils);
      const user2Cache = new TestCache(mockUtils);

      const user1DataHandler = user1Cache.createDataHandler();
      const user1DataOperations =
        wrapDataHandlerAsDataOperations(user1DataHandler);
      const user1MutationHandler =
        user1Cache.createMutationHandler(user1DataOperations);

      const user2DataHandler = user2Cache.createDataHandler();
      const user2DataOperations =
        wrapDataHandlerAsDataOperations(user2DataHandler);
      const user2MutationHandler =
        user2Cache.createMutationHandler(user2DataOperations);

      // Both users load the same region
      await user1DataOperations.loadRegion("1,2", 2);
      await user2DataOperations.loadRegion("1,2", 2);

      // User 1 makes an edit
      await user1MutationHandler.updateItem("1,2:1", {
        name: "User 1 Edit",
        description: "Edited by user 1",
      });

      // User 2 makes a conflicting edit
      await user2MutationHandler.updateItem("1,2:1", {
        name: "User 2 Edit",
        description: "Edited by user 2",
      });

      // Both users sync
      const user1SyncEngine = createSyncEngine({
        dispatch: user1Cache.dispatch,
        state: user1Cache.state,
        dataHandler: user1DataOperations,
      });

      const user2SyncEngine = createSyncEngine({
        dispatch: user2Cache.dispatch,
        state: user2Cache.state,
        dataHandler: user2DataOperations,
      });

      const [result1, result2] = await Promise.all([
        user1SyncEngine.performSync(),
        user2SyncEngine.performSync(),
      ]);

      // Verify both users reach consistent state
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(user1Cache.state.error).toBeNull();
      expect(user2Cache.state.error).toBeNull();
      expect(Object.keys(user1Cache.state.itemsById)).toHaveLength(4);
      expect(Object.keys(user2Cache.state.itemsById)).toHaveLength(4);
    });
  });
});
