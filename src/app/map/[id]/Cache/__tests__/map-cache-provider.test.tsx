/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, render, act } from "@testing-library/react";
import {
  MapCacheProvider,
  useMapCache,
  useMapCacheContext,
  useMapCacheData,
  useMapCacheNavigation,
  useMapCacheMutations,
  useMapCacheSync,
  type MapCacheProviderProps,
} from "../map-cache";
import type { HexTileData } from "../../State/types";

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = vi.fn();
console.warn = mockConsoleWarn;

// Mock Next.js router hooks
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRouter = { push: mockPush, replace: mockReplace };
const mockSearchParams = new URLSearchParams();
const mockPathname = "/map/123";

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

// Mock tRPC
vi.mock("~/commons/trpc/react", () => ({
  api: {
    useUtils: () => ({
      map: {
        getItemsForRootItem: { fetch: vi.fn().mockResolvedValue([]) },
        getItemByCoords: { fetch: vi.fn() },
        getRootItemById: { fetch: vi.fn() },
        getDescendants: { fetch: vi.fn() },
      },
    }),
  },
}));

describe("MapCacheProvider and useMapCache", () => {
  let mockInitialItems: Record<string, HexTileData>;
  let defaultProps: MapCacheProviderProps;

  beforeEach(() => {
    mockInitialItems = {
      "1,2": {
        data: {
          name: "Root Item",
          description: "Root Description",
          url: "http://example.com",
          color: "#000000",
        },
        metadata: {
          coordId: "1,2",
          dbId: "123",
          depth: 0,
          parentId: undefined,
          coordinates: { userId: 1, groupId: 2, path: [] },
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
      "1,2:1": {
        data: {
          name: "Child Item",
          description: "Child Description",
          url: "http://child.example.com",
          color: "#111111",
        },
        metadata: {
          coordId: "1,2:1",
          dbId: "456",
          depth: 1,
          parentId: "123",
          coordinates: { userId: 1, groupId: 2, path: [1] },
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
    };

    defaultProps = {
      children: <div>Test Component</div>,
      initialItems: mockInitialItems,
      initialCenter: "1,2",
      initialExpandedItems: ["1,2:1"],
      mapContext: {
        rootItemId: 123,
        userId: 1,
        groupId: 2,
      },
      cacheConfig: {
        maxAge: 300000,
        backgroundRefreshInterval: 30000,
        enableOptimisticUpdates: true,
        maxDepth: 3,
      },
      testingOverrides: {
        disableSync: true, // Disable sync for testing
        mockRouter,
        mockSearchParams,
        mockPathname,
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("MapCacheProvider", () => {
    test("renders children and provides context", () => {
      const TestComponent = () => {
        const cache = useMapCache();
        return (
          <div data-testid="cache-items">
            {cache.items ? "loaded" : "empty"}
          </div>
        );
      };

      const { getByTestId } = render(
        <MapCacheProvider {...defaultProps}>
          <TestComponent />
        </MapCacheProvider>,
      );

      expect(getByTestId("cache-items")).toHaveTextContent("loaded");
    });

    test("initializes state with provided props", () => {
      const TestComponent = () => {
        const cache = useMapCache();
        return (
          <div>
            <span data-testid="item-count">
              {Object.keys(cache.items).length}
            </span>
            <span data-testid="center">{cache.center}</span>
            <span data-testid="expanded-count">
              {cache.expandedItems.length}
            </span>
          </div>
        );
      };

      const { getByTestId } = render(
        <MapCacheProvider {...defaultProps}>
          <TestComponent />
        </MapCacheProvider>,
      );

      expect(getByTestId("item-count")).toHaveTextContent("2");
      expect(getByTestId("center")).toHaveTextContent("1,2");
      expect(getByTestId("expanded-count")).toHaveTextContent("1");
    });

    test("provides default values when no initial props given", () => {
      const minimalProps: MapCacheProviderProps = {
        children: <div>Test</div>,
        testingOverrides: { disableSync: true },
      };

      const TestComponent = () => {
        const cache = useMapCache();
        return (
          <div>
            <span data-testid="item-count">
              {Object.keys(cache.items).length}
            </span>
            <span data-testid="center">{cache.center || "null"}</span>
          </div>
        );
      };

      const { getByTestId } = render(
        <MapCacheProvider {...minimalProps}>
          <TestComponent />
        </MapCacheProvider>,
      );

      expect(getByTestId("item-count")).toHaveTextContent("0");
      expect(getByTestId("center")).toHaveTextContent("null");
    });
  });

  describe("useMapCache hook", () => {
    const renderWithProvider = (props: Partial<MapCacheProviderProps> = {}) => {
      const finalProps = { ...defaultProps, ...props };
      return renderHook(() => useMapCache(), {
        wrapper: ({ children }) => (
          <MapCacheProvider {...finalProps}>{children}</MapCacheProvider>
        ),
      });
    };

    test("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useMapCache());
      }).toThrow("useMapCache must be used within a MapCacheProvider");

      console.error = originalError;
    });

    test("provides correct initial state", () => {
      const { result } = renderWithProvider();

      expect(result.current.items).toEqual(mockInitialItems);
      expect(result.current.center).toBe("1,2");
      expect(result.current.expandedItems).toEqual(["1,2:1"]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    test("provides query operations", () => {
      const { result } = renderWithProvider();

      expect(typeof result.current.getRegionItems).toBe("function");
      expect(typeof result.current.hasItem).toBe("function");
      expect(typeof result.current.isRegionLoaded).toBe("function");

      // Test query operations
      expect(result.current.hasItem("1,2")).toBe(true);
      expect(result.current.hasItem("missing")).toBe(false);

      const regionItems = result.current.getRegionItems("1,2", 2);
      expect(regionItems).toHaveLength(2);
    });

    test("provides data operations", () => {
      const { result } = renderWithProvider();

      expect(typeof result.current.loadRegion).toBe("function");
      expect(typeof result.current.loadItemChildren).toBe("function");
      expect(typeof result.current.prefetchRegion).toBe("function");
      expect(typeof result.current.invalidateRegion).toBe("function");
      expect(typeof result.current.invalidateAll).toBe("function");
    });

    test("provides navigation operations", () => {
      const { result } = renderWithProvider();

      expect(typeof result.current.navigateToItem).toBe("function");
      expect(typeof result.current.updateCenter).toBe("function");
      expect(typeof result.current.prefetchForNavigation).toBe("function");
    });

    test("provides mutation operations", () => {
      const { result } = renderWithProvider();

      expect(typeof result.current.createItemOptimistic).toBe("function");
      expect(typeof result.current.updateItemOptimistic).toBe("function");
      expect(typeof result.current.deleteItemOptimistic).toBe("function");
      expect(typeof result.current.rollbackOptimisticChange).toBe("function");
      expect(typeof result.current.rollbackAllOptimistic).toBe("function");
      expect(typeof result.current.getPendingOptimisticChanges).toBe(
        "function",
      );
    });

    test("provides sync operations", () => {
      const { result } = renderWithProvider();

      expect(result.current.sync).toBeDefined();
      expect(typeof result.current.sync.performSync).toBe("function");
      expect(typeof result.current.sync.forceSync).toBe("function");
      expect(typeof result.current.sync.pauseSync).toBe("function");
      expect(typeof result.current.sync.resumeSync).toBe("function");
      expect(typeof result.current.sync.getSyncStatus).toBe("function");
    });

    test("provides configuration operations", () => {
      const { result } = renderWithProvider();

      expect(result.current.config).toBeDefined();
      expect(result.current.config.maxAge).toBe(300000);
      expect(result.current.config.enableOptimisticUpdates).toBe(true);
      expect(typeof result.current.updateConfig).toBe("function");
    });

    test("updateCenter changes center state", async () => {
      const { result } = renderWithProvider();

      expect(result.current.center).toBe("1,2");

      await act(async () => {
        result.current.updateCenter("1,2:1");
      });

      expect(result.current.center).toBe("1,2:1");
    });

    test("optimistic mutations work correctly", async () => {
      const { result } = renderWithProvider();

      const initialCount = Object.keys(result.current.items).length;

      await act(async () => {
        await result.current.createItemOptimistic("1,2:2", {
          name: "New Item",
          description: "New Description",
        });
      });

      // Should have pending optimistic change
      const pendingChanges = result.current.getPendingOptimisticChanges();
      expect(pendingChanges).toHaveLength(1);
      expect(pendingChanges[0]?.type).toBe("create");
    });
  });

  describe("Convenience hooks", () => {
    const renderWithProvider = (props: Partial<MapCacheProviderProps> = {}) => {
      const finalProps = { ...defaultProps, ...props };
      return {
        data: renderHook(() => useMapCacheData(), {
          wrapper: ({ children }) => (
            <MapCacheProvider {...finalProps}>{children}</MapCacheProvider>
          ),
        }),
        navigation: renderHook(() => useMapCacheNavigation(), {
          wrapper: ({ children }) => (
            <MapCacheProvider {...finalProps}>{children}</MapCacheProvider>
          ),
        }),
        mutations: renderHook(() => useMapCacheMutations(), {
          wrapper: ({ children }) => (
            <MapCacheProvider {...finalProps}>{children}</MapCacheProvider>
          ),
        }),
        sync: renderHook(() => useMapCacheSync(), {
          wrapper: ({ children }) => (
            <MapCacheProvider {...finalProps}>{children}</MapCacheProvider>
          ),
        }),
      };
    };

    test("useMapCacheData returns data operations only", () => {
      const { data } = renderWithProvider();

      expect(data.result.current).toHaveProperty("items");
      expect(data.result.current).toHaveProperty("center");
      expect(data.result.current).toHaveProperty("expandedItems");
      expect(data.result.current).toHaveProperty("isLoading");
      expect(data.result.current).toHaveProperty("error");
      expect(data.result.current).toHaveProperty("getRegionItems");
      expect(data.result.current).toHaveProperty("hasItem");

      // Should not have navigation or mutation operations
      expect(data.result.current).not.toHaveProperty("navigateToItem");
      expect(data.result.current).not.toHaveProperty("createItemOptimistic");
    });

    test("useMapCacheNavigation returns navigation operations only", () => {
      const { navigation } = renderWithProvider();

      expect(navigation.result.current).toHaveProperty("navigateToItem");
      expect(navigation.result.current).toHaveProperty("updateCenter");
      expect(navigation.result.current).toHaveProperty("prefetchForNavigation");

      // Should not have data or mutation operations
      expect(navigation.result.current).not.toHaveProperty("items");
      expect(navigation.result.current).not.toHaveProperty(
        "createItemOptimistic",
      );
    });

    test("useMapCacheMutations returns mutation operations only", () => {
      const { mutations } = renderWithProvider();

      expect(mutations.result.current).toHaveProperty("createItemOptimistic");
      expect(mutations.result.current).toHaveProperty("updateItemOptimistic");
      expect(mutations.result.current).toHaveProperty("deleteItemOptimistic");
      expect(mutations.result.current).toHaveProperty(
        "rollbackOptimisticChange",
      );
      expect(mutations.result.current).toHaveProperty("rollbackAllOptimistic");
      expect(mutations.result.current).toHaveProperty(
        "getPendingOptimisticChanges",
      );

      // Should not have data or navigation operations
      expect(mutations.result.current).not.toHaveProperty("items");
      expect(mutations.result.current).not.toHaveProperty("navigateToItem");
    });

    test("useMapCacheSync returns sync operations only", () => {
      const { sync } = renderWithProvider();

      expect(sync.result.current).toHaveProperty("performSync");
      expect(sync.result.current).toHaveProperty("forceSync");
      expect(sync.result.current).toHaveProperty("pauseSync");
      expect(sync.result.current).toHaveProperty("resumeSync");
      expect(sync.result.current).toHaveProperty("getSyncStatus");

      // Should not have other operations
      expect(sync.result.current).not.toHaveProperty("items");
      expect(sync.result.current).not.toHaveProperty("navigateToItem");
    });
  });

  describe("useMapCacheContext", () => {
    test("provides access to internal context", () => {
      const { result } = renderHook(() => useMapCacheContext(), {
        wrapper: ({ children }) => (
          <MapCacheProvider {...defaultProps}>{children}</MapCacheProvider>
        ),
      });

      expect(result.current.state).toBeDefined();
      expect(result.current.dispatch).toBeDefined();
      expect(result.current.dataOperations).toBeDefined();
      expect(result.current.mutationOperations).toBeDefined();
      expect(result.current.navigationOperations).toBeDefined();
      expect(result.current.syncOperations).toBeDefined();
      expect(result.current.serverService).toBeDefined();
      expect(result.current.storageService).toBeDefined();
    });

    test("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useMapCacheContext());
      }).toThrow("useMapCacheContext must be used within a MapCacheProvider");

      console.error = originalError;
    });
  });

  describe("Error handling", () => {
    test("handles initialization errors gracefully", () => {
      const errorProps: MapCacheProviderProps = {
        ...defaultProps,
        // @ts-expect-error - Testing invalid props
        initialItems: "invalid",
      };

      // Should not throw during render
      expect(() => {
        render(
          <MapCacheProvider {...errorProps}>
            <div>Test</div>
          </MapCacheProvider>,
        );
      }).not.toThrow();
    });
  });

  describe("Configuration", () => {
    test("applies custom cache configuration", () => {
      const customConfig = {
        maxAge: 600000,
        backgroundRefreshInterval: 60000,
        enableOptimisticUpdates: false,
        maxDepth: 5,
      };

      const { result } = renderHook(() => useMapCache(), {
        wrapper: ({ children }) => (
          <MapCacheProvider {...defaultProps} cacheConfig={customConfig}>
            {children}
          </MapCacheProvider>
        ),
      });

      expect(result.current.config).toEqual(customConfig);
    });

    test("updateConfig modifies configuration", async () => {
      const { result } = renderHook(() => useMapCache(), {
        wrapper: ({ children }) => (
          <MapCacheProvider {...defaultProps}>{children}</MapCacheProvider>
        ),
      });

      const newConfig = { maxAge: 600000 };

      await act(async () => {
        result.current.updateConfig(newConfig);
      });

      expect(result.current.config.maxAge).toBe(600000);
      // Other config values should remain unchanged
      expect(result.current.config.enableOptimisticUpdates).toBe(true);
    });
  });

  describe("Memory management", () => {
    test("properly cleans up on unmount", () => {
      const { unmount } = renderHook(() => useMapCache(), {
        wrapper: ({ children }) => (
          <MapCacheProvider {...defaultProps}>{children}</MapCacheProvider>
        ),
      });

      // Should not throw during unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});
