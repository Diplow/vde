import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  createServerService,
  useServerService,
  createServerServiceFactory,
  createMockServerService,
} from "../server-service";
import { ServiceError, NetworkError, TimeoutError } from "../types";
import type { ServerService, ServiceConfig } from "../types";

// Mock console.warn to avoid noise in tests
const mockConsoleWarn = vi.fn();
console.warn = mockConsoleWarn;

describe("Server Service", () => {
  let mockUtils: any;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    mockUtils = {
      map: {
        getItemsForRootItem: {
          fetch: mockFetch,
        },
        getItemByCoords: {
          fetch: vi.fn(),
        },
        getRootItemById: {
          fetch: vi.fn(),
        },
        getDescendants: {
          fetch: vi.fn(),
        },
        // Mutations are not used in the service anymore
        addItem: {
          useMutation: vi.fn(), // Only for reference
        },
        updateItem: {
          useMutation: vi.fn(), // Only for reference
        },
        removeItem: {
          useMutation: vi.fn(), // Only for reference
        },
        moveMapItem: {
          useMutation: vi.fn(), // Only for reference
        },
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createServerService (Pure Function)", () => {
    test("creates service with default configuration", () => {
      const service = createServerService(mockUtils);

      expect(service).toHaveProperty("fetchItemsForCoordinate");
      expect(service).toHaveProperty("getItemByCoordinate");
      expect(service).toHaveProperty("getRootItemById");
      expect(service).toHaveProperty("getDescendants");
      expect(service).toHaveProperty("createItem");
      expect(service).toHaveProperty("updateItem");
      expect(service).toHaveProperty("deleteItem");

      expect(typeof service.fetchItemsForCoordinate).toBe("function");
      expect(typeof service.getItemByCoordinate).toBe("function");
      expect(typeof service.getRootItemById).toBe("function");
      expect(typeof service.getDescendants).toBe("function");
    });

    test("creates service with custom configuration", () => {
      const config: ServiceConfig = {
        enableRetry: false,
        retryAttempts: 1,
        retryDelay: 500,
        timeoutMs: 5000,
      };

      const service = createServerService(mockUtils, config);
      expect(service).toBeDefined();
    });
  });

  describe("fetchItemsForCoordinate", () => {
    test("successfully fetches items", async () => {
      const mockItems = [
        {
          id: "1",
          coordinates: "1,2",
          name: "Test Item",
          descr: "Test Description",
          depth: 1,
          url: "",
          parentId: null,
          itemType: "BASE",
          ownerId: "test-owner",
        },
      ];

      mockFetch.mockResolvedValue(mockItems);

      const service = createServerService(mockUtils);
      const result = await service.fetchItemsForCoordinate({
        centerCoordId: "1,2",
        maxDepth: 2,
      });

      expect(result).toEqual(mockItems);
      expect(mockFetch).toHaveBeenCalledWith({
        userId: 1,
        groupId: 2,
      });
    });

    test("handles unauthorized errors", async () => {
      mockFetch.mockRejectedValue(new Error("UNAUTHORIZED"));

      const service = createServerService(mockUtils);

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow(ServiceError);

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow("Unauthorized access to map data");
    });

    test("handles not found errors", async () => {
      mockFetch.mockRejectedValue(new Error("NOT_FOUND"));

      const service = createServerService(mockUtils);

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow(ServiceError);

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow("Map data not found");
    });

    test("handles timeout errors", async () => {
      mockFetch.mockRejectedValue(new Error("TIMEOUT"));

      const service = createServerService(mockUtils);

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow(TimeoutError);
    });

    test("handles network errors with retry", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network failed"))
        .mockRejectedValueOnce(new Error("Network failed"))
        .mockResolvedValue([]);

      const service = createServerService(mockUtils, { retryAttempts: 3 });

      const result = await service.fetchItemsForCoordinate({
        centerCoordId: "1,2",
        maxDepth: 2,
      });

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test("fails after retry attempts exhausted", async () => {
      mockFetch.mockRejectedValue(new Error("Persistent network error"));

      const service = createServerService(mockUtils, { retryAttempts: 2 });

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow(NetworkError);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test("works without retry when disabled", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const service = createServerService(mockUtils, { enableRetry: false });

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow(NetworkError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test("handles timeout with custom timeout setting", async () => {
      // Mock a slow response
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 2000)),
      );

      const service = createServerService(mockUtils, { timeoutMs: 1000 });

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow(TimeoutError);
    }, 10000);
  });

  describe("Additional query methods", () => {
    test("getItemByCoordinate works correctly", async () => {
      const item = {
        id: "item-id",
        coordinates: "1,2:1",
        name: "Test Item",
      };
      mockUtils.map.getItemByCoords.fetch.mockResolvedValue(item);

      const service = createServerService(mockUtils);
      const result = await service.getItemByCoordinate("1,2:1");

      expect(mockUtils.map.getItemByCoords.fetch).toHaveBeenCalledWith({
        coords: { userId: 1, groupId: 2, path: [1] },
      });
      expect(result).toEqual(item);
    });

    test("getRootItemById works correctly", async () => {
      const rootItem = {
        id: "root-id",
        coordinates: "1,2",
        name: "Root Item",
      };
      mockUtils.map.getRootItemById.fetch.mockResolvedValue(rootItem);

      const service = createServerService(mockUtils);
      const result = await service.getRootItemById(123);

      expect(mockUtils.map.getRootItemById.fetch).toHaveBeenCalledWith({
        mapItemId: 123,
      });
      expect(result).toEqual(rootItem);
    });

    test("getDescendants works correctly", async () => {
      const descendants = [
        { id: "child-1", name: "Child 1" },
        { id: "child-2", name: "Child 2" },
      ];
      mockUtils.map.getDescendants.fetch.mockResolvedValue(descendants);

      const service = createServerService(mockUtils);
      const result = await service.getDescendants(123);

      expect(mockUtils.map.getDescendants.fetch).toHaveBeenCalledWith({
        itemId: 123,
      });
      expect(result).toEqual(descendants);
    });
  });

  describe("Mutation placeholders (architectural errors)", () => {
    test("createItem throws architectural error", async () => {
      const service = createServerService(mockUtils);

      await expect(
        service.createItem({
          coordId: "1,2:1",
          data: { name: "New Child Item", description: "New Description" },
        }),
      ).rejects.toThrow(ServiceError);

      await expect(
        service.createItem({
          coordId: "1,2:1",
          data: { name: "New Child Item", description: "New Description" },
        }),
      ).rejects.toThrow(
        "Mutations should be handled through the mutation layer, not the server service",
      );
    });

    test("updateItem throws architectural error", async () => {
      const service = createServerService(mockUtils);

      await expect(
        service.updateItem({
          coordId: "1,2:1",
          data: { name: "Updated Item", description: "Updated Description" },
        }),
      ).rejects.toThrow(ServiceError);

      await expect(
        service.updateItem({
          coordId: "1,2:1",
          data: { name: "Updated Item", description: "Updated Description" },
        }),
      ).rejects.toThrow(
        "Mutations should be handled through the mutation layer, not the server service",
      );
    });

    test("deleteItem throws architectural error", async () => {
      const service = createServerService(mockUtils);

      await expect(service.deleteItem({ coordId: "1,2:1" })).rejects.toThrow(
        ServiceError,
      );

      await expect(service.deleteItem({ coordId: "1,2:1" })).rejects.toThrow(
        "Mutations should be handled through the mutation layer, not the server service",
      );
    });
  });

  describe("useServerService Hook", () => {
    // Mock tRPC context for hook testing
    // NOTE: These tests are commented out because they require complex tRPC provider setup
    // The main benefit is the pure function approach, which we test extensively above

    test.skip("hook returns service with same interface", () => {
      // This would require proper tRPC test provider setup
      // For now, we focus on testing the pure createServerService function
      // which is the primary interface for testing
    });

    test.skip("hook uses provided config", () => {
      // This would require proper tRPC test provider setup
      // For now, we focus on testing the pure createServerService function
    });
  });

  describe("createServerServiceFactory", () => {
    test("creates factory function", () => {
      const factory = createServerServiceFactory({ retryAttempts: 5 });

      expect(typeof factory).toBe("function");

      const service = factory(mockUtils);
      expect(service).toHaveProperty("fetchItemsForCoordinate");
    });

    test("factory preserves configuration", async () => {
      const factory = createServerServiceFactory({ enableRetry: false });
      const service = factory(mockUtils);

      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        service.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow();

      // Should only call once since retry is disabled
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("createMockServerService", () => {
    test("creates mock service with default rejections", () => {
      const mockService = createMockServerService();

      expect(mockService).toHaveProperty("fetchItemsForCoordinate");
      expect(mockService).toHaveProperty("getItemByCoordinate");
      expect(mockService).toHaveProperty("getRootItemById");
      expect(mockService).toHaveProperty("getDescendants");
      expect(mockService).toHaveProperty("createItem");
      expect(mockService).toHaveProperty("updateItem");
      expect(mockService).toHaveProperty("deleteItem");
    });

    test("uses provided mock responses", async () => {
      const mockItems = [{ id: "1", name: "Mock Item" }];
      const mockService = createMockServerService({
        fetchItemsForCoordinate: vi.fn().mockResolvedValue(mockItems),
      });

      const result = await mockService.fetchItemsForCoordinate({
        centerCoordId: "1,2",
        maxDepth: 2,
      });

      expect(result).toEqual(mockItems);
    });

    test("rejects with not implemented for unimplemented methods", async () => {
      const mockService = createMockServerService();

      await expect(
        mockService.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow(ServiceError);

      await expect(
        mockService.fetchItemsForCoordinate({
          centerCoordId: "1,2",
          maxDepth: 2,
        }),
      ).rejects.toThrow("Mock not implemented");
    });
  });

  describe("Error handling", () => {
    test("ServiceError maintains error code and original error", () => {
      const originalError = new Error("Original");
      const serviceError = new ServiceError(
        "Service failed",
        "SERVICE_ERROR",
        originalError,
      );

      expect(serviceError.message).toBe("Service failed");
      expect(serviceError.code).toBe("SERVICE_ERROR");
      expect(serviceError.originalError).toBe(originalError);
      expect(serviceError.name).toBe("ServiceError");
    });

    test("NetworkError is instance of ServiceError", () => {
      const networkError = new NetworkError("Network failed");

      expect(networkError).toBeInstanceOf(ServiceError);
      expect(networkError.code).toBe("NETWORK_ERROR");
      expect(networkError.name).toBe("NetworkError");
    });

    test("TimeoutError is instance of ServiceError", () => {
      const timeoutError = new TimeoutError("Timeout");

      expect(timeoutError).toBeInstanceOf(ServiceError);
      expect(timeoutError.code).toBe("TIMEOUT_ERROR");
      expect(timeoutError.name).toBe("TimeoutError");
    });
  });

  describe("Complex coordinate parsing", () => {
    test("handles complex coordinate IDs", async () => {
      mockFetch.mockResolvedValue([]);

      const service = createServerService(mockUtils);

      await service.fetchItemsForCoordinate({
        centerCoordId: "1,2:3,4,5",
        maxDepth: 3,
      });

      expect(mockFetch).toHaveBeenCalledWith({
        userId: 1,
        groupId: 2,
      });
    });

    test("handles root coordinate IDs", async () => {
      mockFetch.mockResolvedValue([]);

      const service = createServerService(mockUtils);

      await service.fetchItemsForCoordinate({
        centerCoordId: "10,20",
        maxDepth: 1,
      });

      expect(mockFetch).toHaveBeenCalledWith({
        userId: 10,
        groupId: 20,
      });
    });
  });
});
