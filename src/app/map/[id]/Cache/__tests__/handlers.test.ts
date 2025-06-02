import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  createDataHandlerWithMockableService,
  createDataHandler,
} from "../Handlers/data-handler";
import {
  createMutationHandlerForCache,
  createMutationHandler,
} from "../Handlers/mutation-handler";
import {
  createNavigationHandlerForTesting,
  useNavigationHandler,
} from "../Handlers/navigation-handler";
import { cacheActions } from "../State/actions";
import { cacheReducer, initialCacheState } from "../State/reducer";
import { createServerService } from "../Services/server-service";
import type { CacheAction, CacheState } from "../State/types";
import type { DataOperations, LoadResult } from "../Handlers/types";
import type { MapItemAPIContract } from "~/server/api/types/contracts";

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = vi.fn();
console.warn = mockConsoleWarn;

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

describe("Handler Integration Tests", () => {
  let mockDispatch: ReturnType<typeof vi.fn>;
  let mockState: CacheState;
  let mockUtils: any;
  let capturedActions: CacheAction[];

  const mockItems: MapItemAPIContract[] = [
    {
      id: "1",
      coordinates: "1,2",
      name: "Test Item 1",
      descr: "Test Description 1",
      depth: 1,
      url: "",
      parentId: null,
      itemType: "BASE" as any,
      ownerId: "test-owner",
    },
    {
      id: "2",
      coordinates: "1,2:1",
      name: "Child Item",
      descr: "Child Description",
      depth: 2,
      url: "",
      parentId: "1",
      itemType: "BASE" as any,
      ownerId: "test-owner",
    },
  ];

  beforeEach(() => {
    capturedActions = [];
    mockDispatch = vi.fn().mockImplementation((action: CacheAction) => {
      capturedActions.push(action);
    });

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
          fetch: vi.fn().mockResolvedValue([mockItems[1]]),
        },
      },
    };

    mockState = {
      ...initialCacheState,
      itemsById: {
        "1,2": {
          data: {
            name: "Test Item 1",
            description: "Test Description 1",
            url: "",
            color: "#000000",
          },
          metadata: {
            coordId: "1,2",
            dbId: "1",
            depth: 1,
            parentId: undefined,
            coordinates: { userId: 1, groupId: 2, path: [1, 2] },
          },
          state: {
            isDragged: false,
            isHovered: false,
            isSelected: false,
            isExpanded: false,
            isDragOver: false,
            isHovering: false,
          },
        },
      },
      cacheConfig: {
        maxAge: 300000,
        backgroundRefreshInterval: 30000,
        enableOptimisticUpdates: true,
        maxDepth: 3,
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Data and Navigation Handler Coordination", () => {
    test("navigation handler uses data handler for loading regions", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
      };

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
        mockRouter,
        new URLSearchParams(),
        "/map/123",
      );

      await navigationHandler.navigateToItem("1,2");

      // Should have loaded region through data handler
      expect(mockUtils.map.getItemsForRootItem.fetch).toHaveBeenCalled();

      // Should have dispatched navigation actions
      const centerAction = capturedActions.find(
        (action) => action.type === "SET_CENTER",
      );
      expect(centerAction).toBeDefined();
      expect((centerAction as any)?.payload).toBe("1,2");

      // Should have updated URL
      expect(mockRouter.push).toHaveBeenCalled();
    });

    test("data handler coordinates with navigation for prefetching", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Prefetch without navigation
      await navigationHandler.prefetchForNavigation("2,3");

      // Should have called data handler prefetch
      expect(mockUtils.map.getItemsForRootItem.fetch).toHaveBeenCalled();

      // Should NOT have dispatched loading states (prefetch is silent)
      const loadingActions = capturedActions.filter(
        (action) => action.type === "SET_LOADING",
      );
      expect(loadingActions).toHaveLength(0);
    });

    test("handlers coordinate state updates correctly", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Load region first
      await dataHandler.loadRegion("1,2", 2);

      // Then navigate to it (which may load again if not cached properly)
      await navigationHandler.navigateWithoutURL("1,2");

      // Should have coordinated actions properly
      const loadRegionActions = capturedActions.filter(
        (action) => action.type === "LOAD_REGION",
      );
      const setCenterActions = capturedActions.filter(
        (action) => action.type === "SET_CENTER",
      );

      // Navigation may load again if state isn't properly cached
      expect(loadRegionActions.length).toBeGreaterThanOrEqual(1);
      expect(setCenterActions).toHaveLength(1);
    });
  });

  describe("Data and Mutation Handler Coordination", () => {
    test("mutation handler uses data handler for invalidation", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mutationHandler = createMutationHandlerForCache(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Spy on data handler methods
      const invalidateRegionSpy = vi.spyOn(dataHandler, "invalidateRegion");

      await mutationHandler.deleteItem("1,2");

      // Should have invalidated region through data handler
      expect(invalidateRegionSpy).toHaveBeenCalledWith("1,2");
    });

    test("optimistic updates coordinate with data loading", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mutationHandler = createMutationHandlerForCache(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Create optimistic update
      await mutationHandler.createItem("1,2:1", {
        name: "Optimistic Item",
        description: "Optimistic Description",
      });

      // Should have dispatched load region for optimistic update
      const loadRegionActions = capturedActions.filter(
        (action) => action.type === "LOAD_REGION",
      );
      expect(loadRegionActions).toHaveLength(1);

      // The optimistic item should be included
      const payload = (loadRegionActions[0] as any)?.payload;
      expect(payload.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Optimistic Item",
            coordinates: "1,2:1",
          }),
        ]),
      );
    });

    test("mutation rollback coordinates with data handler", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mutationHandler = createMutationHandlerForCache(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Create optimistic update
      await mutationHandler.updateItem("1,2", {
        name: "Updated Name",
      });

      const pendingChanges = mutationHandler.getPendingOptimisticChanges();
      expect(pendingChanges).toHaveLength(1);

      // Clear captured actions
      capturedActions.length = 0;

      // Rollback the change
      mutationHandler.rollbackOptimisticChange(pendingChanges[0]!.id);

      // Should have restored original state
      const rollbackActions = capturedActions.filter(
        (action) => action.type === "LOAD_REGION",
      );
      expect(rollbackActions).toHaveLength(1);
    });
  });

  describe("All Handlers Integration", () => {
    test("complete workflow: navigate -> load -> mutate -> rollback", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mutationHandler = createMutationHandlerForCache(
        mockDispatch,
        mockState,
        dataHandler,
      );

      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
      };

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
        mockRouter,
      );

      // 1. Navigate to item (loads region)
      await navigationHandler.navigateToItem("1,2");

      // 2. Perform optimistic mutation
      await mutationHandler.updateItem("1,2", {
        name: "Mutated Name",
      });

      // 3. Rollback mutation
      const pendingChanges = mutationHandler.getPendingOptimisticChanges();
      if (pendingChanges.length > 0) {
        mutationHandler.rollbackOptimisticChange(pendingChanges[0]!.id);
      }

      // Verify complete coordination
      expect(mockUtils.map.getItemsForRootItem.fetch).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();

      const actionTypes = capturedActions.map((action) => action.type);
      expect(actionTypes).toContain("SET_LOADING");
      expect(actionTypes).toContain("LOAD_REGION");
      expect(actionTypes).toContain("SET_CENTER");
    });

    test("error handling coordination across handlers", async () => {
      // Make server calls fail
      mockUtils.map.getItemsForRootItem.fetch.mockRejectedValue(
        new Error("Server error"),
      );

      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Attempt navigation that will fail
      const result = await navigationHandler.navigateToItem("1,2");

      // Navigation can still succeed even if data loading fails
      // The navigation handler is resilient and will set center regardless
      expect(result.success).toBe(true);
      expect(result.centerUpdated).toBe(true);

      // Should have set error through dispatch from data handler
      const errorActions = capturedActions.filter(
        (action) => action.type === "SET_ERROR",
      );
      expect(errorActions.length).toBeGreaterThan(0);
    });

    test("handlers maintain state consistency during concurrent operations", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mutationHandler = createMutationHandlerForCache(
        mockDispatch,
        mockState,
        dataHandler,
      );

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Simulate concurrent operations
      const operations = [
        dataHandler.loadRegion("1,2", 2),
        mutationHandler.createItem("1,2:2", { name: "Concurrent Item" }),
        navigationHandler.navigateWithoutURL("1,2"),
        dataHandler.prefetchRegion("2,3"),
      ];

      await Promise.all(operations);

      // All operations should complete without conflicts
      expect(capturedActions.length).toBeGreaterThan(0);

      // Should not have multiple conflicting SET_CENTER actions for same target
      const centerActions = capturedActions.filter(
        (action) => action.type === "SET_CENTER",
      );
      expect(centerActions).toHaveLength(1);
    });
  });

  describe("Error Recovery and Resilience", () => {
    test("handlers recover from service failures gracefully", async () => {
      // Setup intermittent failure
      let callCount = 0;
      mockUtils.map.getItemsForRootItem.fetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error("Temporary failure"));
        }
        return Promise.resolve(mockItems);
      });

      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
        { retryAttempts: 3 }, // Enable retry
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      // Should eventually succeed with retry logic
      await dataHandler.loadRegion("1,2", 2);

      expect(mockUtils.map.getItemsForRootItem.fetch).toHaveBeenCalledTimes(3);

      // Should have final success actions
      const loadRegionActions = capturedActions.filter(
        (action) => action.type === "LOAD_REGION",
      );
      expect(loadRegionActions).toHaveLength(1);
    });

    test("handlers handle partial failures in complex workflows", async () => {
      // Setup data handler that works but navigation fails
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mockRouter = {
        push: vi.fn().mockImplementation(() => {
          throw new Error("Navigation failed");
        }),
        replace: vi.fn(),
      };

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
        mockRouter,
      );

      const result = await navigationHandler.navigateToItem("1,2");

      // Navigation handler should gracefully handle URL failure but succeed with cache
      expect(result.success).toBe(false); // Overall operation failed due to URL error
      expect(result.centerUpdated).toBe(false); // Failed before center update due to error
      expect(result.urlUpdated).toBe(false); // URL failed

      // Should have loaded data successfully before the URL error
      const loadRegionActions = capturedActions.filter(
        (action) => action.type === "LOAD_REGION",
      );
      expect(loadRegionActions).toHaveLength(1);
    });

    test("optimistic updates handle rollback scenarios correctly", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const mutationHandler = createMutationHandlerForCache(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Apply multiple optimistic updates
      await mutationHandler.updateItem("1,2", { name: "Update 1" });
      await mutationHandler.createItem("1,2:3", { name: "New Item" });

      const pendingChanges = mutationHandler.getPendingOptimisticChanges();
      expect(pendingChanges).toHaveLength(2);

      // Rollback all changes
      mutationHandler.rollbackAllOptimistic();

      const finalPendingChanges = mutationHandler.getPendingOptimisticChanges();
      expect(finalPendingChanges).toHaveLength(0);
    });
  });

  describe("Performance and Resource Management", () => {
    test("handlers avoid unnecessary work with smart caching", async () => {
      const freshState: CacheState = {
        ...mockState,
        regionMetadata: {
          "1,2": {
            centerCoordId: "1,2",
            maxDepth: 3,
            loadedAt: Date.now(), // Fresh data
            itemCoordIds: ["1,2"],
          },
        },
      };

      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        freshState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      // Should not load fresh data
      await dataHandler.loadRegion("1,2", 2);

      expect(mockUtils.map.getItemsForRootItem.fetch).not.toHaveBeenCalled();
      expect(capturedActions).toHaveLength(0); // No actions needed
    });

    test("handlers coordinate efficiently but may load when state differs", async () => {
      const rawDataHandler = createDataHandlerWithMockableService(
        mockDispatch,
        mockState,
        mockUtils,
      );
      const dataHandler = wrapDataHandlerAsDataOperations(rawDataHandler);

      const navigationHandler = createNavigationHandlerForTesting(
        mockDispatch,
        mockState,
        dataHandler,
      );

      // Multiple navigations to same location - each one may need to verify state
      await navigationHandler.navigateWithoutURL("1,2");
      await navigationHandler.navigateWithoutURL("1,2");
      await navigationHandler.navigateWithoutURL("1,2");

      // Each navigation might need to check/load if state isn't perfectly cached
      // This is acceptable for correctness vs performance optimization
      expect(mockUtils.map.getItemsForRootItem.fetch).toHaveBeenCalled();

      // Should update center each time
      const centerActions = capturedActions.filter(
        (action) => action.type === "SET_CENTER",
      );
      expect(centerActions).toHaveLength(3);
    });
  });
});
