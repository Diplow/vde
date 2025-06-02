import { useMemo } from "react";
import { api } from "~/commons/trpc/react";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { HexCoord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type {
  ServerService,
  ServiceConfig,
  NetworkError,
  TimeoutError,
  ServiceError,
} from "./types";
import {
  NetworkError as NetworkErrorClass,
  TimeoutError as TimeoutErrorClass,
  ServiceError as ServiceErrorClass,
} from "./types";

// Default configuration for server service
const DEFAULT_CONFIG: Required<ServiceConfig> = {
  enableRetry: true,
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  timeoutMs: 10000, // 10 seconds
};

// Retry utility function
async function withRetry<T>(
  operation: () => Promise<T>,
  config: Required<ServiceConfig>,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      // Add timeout to the operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new TimeoutErrorClass(
                `Operation timed out after ${config.timeoutMs}ms`,
              ),
            ),
          config.timeoutMs,
        );
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain error types
      if (
        error instanceof TimeoutErrorClass ||
        error instanceof ServiceErrorClass
      ) {
        throw error;
      }

      // If this was the last attempt, don't continue retrying
      if (attempt === config.retryAttempts) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = config.retryDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // After exhausting retries, wrap the final error in a NetworkError if it's not already a ServiceError
  if (lastError && !(lastError instanceof ServiceErrorClass)) {
    throw new NetworkErrorClass(
      `Operation failed after ${config.retryAttempts} attempts`,
      lastError,
    );
  }

  throw lastError;
}

/**
 * Pure server service factory function - easy to test with direct mocking
 * Only handles query operations with retry logic and error handling.
 * Mutations are handled by the mutation layer using tRPC hooks directly.
 *
 * @example
 * ```tsx
 * const mockUtils = { map: { getItemsForRootItem: { fetch: vi.fn() } } };
 * const service = createServerService(mockUtils, { retryAttempts: 5 });
 * ```
 */
export function createServerService(
  utils: ReturnType<typeof api.useUtils>,
  config: ServiceConfig = {},
): ServerService {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Wrapper for tRPC errors to ServiceError types
  const withErrorTransform = async <T>(
    operation: () => Promise<T>,
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      // Transform tRPC errors into ServiceError types
      if (error instanceof Error) {
        if (error.message.includes("UNAUTHORIZED")) {
          throw new ServiceErrorClass(
            "Unauthorized access to map data",
            "UNAUTHORIZED",
            error,
          );
        } else if (error.message.includes("NOT_FOUND")) {
          throw new ServiceErrorClass("Map data not found", "NOT_FOUND", error);
        } else if (error.message.includes("TIMEOUT")) {
          throw new TimeoutErrorClass("Request timed out");
        }
      }

      // For retry logic, just re-throw the original error without wrapping
      // The retry mechanism will handle wrapping it in NetworkError after retries are exhausted
      // However, if retry is disabled, we need to wrap it ourselves
      if (!finalConfig.enableRetry) {
        throw new NetworkErrorClass("Server request failed", error as Error);
      }

      throw error;
    }
  };

  return {
    // Data fetching operations only
    fetchItemsForCoordinate: async (params: {
      centerCoordId: string;
      maxDepth: number;
    }) => {
      const operation = async () => {
        // Parse the coordinate to get user and group information
        const coords = CoordSystem.parseId(params.centerCoordId);

        // Call tRPC API to fetch items
        // Note: Current API loads all items for a root, but in the future
        // this should be enhanced to support loading from specific coordinates
        const items = await utils.map.getItemsForRootItem.fetch({
          userId: coords.userId,
          groupId: coords.groupId,
          // TODO: Add centerCoordId and maxDepth parameters to the API
          // centerCoordId: params.centerCoordId,
          // maxDepth: params.maxDepth,
        });

        return items;
      };

      return finalConfig.enableRetry
        ? withRetry(() => withErrorTransform(operation), finalConfig)
        : withErrorTransform(operation);
    },

    // Additional helper methods using the available tRPC APIs (queries only)
    getItemByCoordinate: async (coordId: string) => {
      const operation = async () => {
        const coords = CoordSystem.parseId(coordId);
        const item = await utils.map.getItemByCoords.fetch({
          coords: coords as HexCoord,
        });
        return item;
      };

      return finalConfig.enableRetry
        ? withRetry(() => withErrorTransform(operation), finalConfig)
        : withErrorTransform(operation);
    },

    getRootItemById: async (mapItemId: number) => {
      const operation = async () => {
        const item = await utils.map.getRootItemById.fetch({ mapItemId });
        return item;
      };

      return finalConfig.enableRetry
        ? withRetry(() => withErrorTransform(operation), finalConfig)
        : withErrorTransform(operation);
    },

    getDescendants: async (itemId: number) => {
      const operation = async () => {
        const descendants = await utils.map.getDescendants.fetch({ itemId });
        return descendants;
      };

      return finalConfig.enableRetry
        ? withRetry(() => withErrorTransform(operation), finalConfig)
        : withErrorTransform(operation);
    },

    // Mutations are explicitly NOT implemented here
    // They should be handled through the mutation layer using tRPC hooks
    createItem: async () => {
      throw new ServiceErrorClass(
        "Mutations should be handled through the mutation layer, not the server service",
        "ARCHITECTURAL_ERROR",
      );
    },

    updateItem: async () => {
      throw new ServiceErrorClass(
        "Mutations should be handled through the mutation layer, not the server service",
        "ARCHITECTURAL_ERROR",
      );
    },

    deleteItem: async () => {
      throw new ServiceErrorClass(
        "Mutations should be handled through the mutation layer, not the server service",
        "ARCHITECTURAL_ERROR",
      );
    },
  };
}

/**
 * React hook wrapper for convenient usage in components.
 * Uses the pure service factory internally for consistency.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const serverService = useServerService({ retryAttempts: 5 });
 *
 *   const handleFetch = async () => {
 *     const items = await serverService.fetchItemsForCoordinate({
 *       centerCoordId: "1,2",
 *       maxDepth: 3
 *     });
 *   };
 * }
 * ```
 */
export function useServerService(config: ServiceConfig = {}): ServerService {
  const utils = api.useUtils();

  return useMemo(() => {
    return createServerService(utils, config);
  }, [utils, config]);
}

// Factory function for easier dependency injection
export function createServerServiceFactory(
  config: ServiceConfig = {},
): (utils: ReturnType<typeof api.useUtils>) => ServerService {
  return (utils) => createServerService(utils, config);
}

// Mock server service for testing
export function createMockServerService(
  mockResponses: Partial<ServerService> = {},
): ServerService {
  return {
    fetchItemsForCoordinate:
      mockResponses.fetchItemsForCoordinate ||
      (async () => {
        throw new ServiceErrorClass("Mock not implemented", "NOT_IMPLEMENTED");
      }),
    getItemByCoordinate:
      mockResponses.getItemByCoordinate ||
      (async () => {
        throw new ServiceErrorClass("Mock not implemented", "NOT_IMPLEMENTED");
      }),
    getRootItemById:
      mockResponses.getRootItemById ||
      (async () => {
        throw new ServiceErrorClass("Mock not implemented", "NOT_IMPLEMENTED");
      }),
    getDescendants:
      mockResponses.getDescendants ||
      (async () => {
        throw new ServiceErrorClass("Mock not implemented", "NOT_IMPLEMENTED");
      }),
    createItem:
      mockResponses.createItem ||
      (async () => {
        throw new ServiceErrorClass("Mock not implemented", "NOT_IMPLEMENTED");
      }),
    updateItem:
      mockResponses.updateItem ||
      (async () => {
        throw new ServiceErrorClass("Mock not implemented", "NOT_IMPLEMENTED");
      }),
    deleteItem:
      mockResponses.deleteItem ||
      (async () => {
        throw new ServiceErrorClass("Mock not implemented", "NOT_IMPLEMENTED");
      }),
  };
}

/**
 * Static server service for server-side usage (SSR, server actions, etc.)
 * This version doesn't use React hooks and can be used in server contexts.
 */
export const createStaticServerService = async (config: ServiceConfig = {}) => {
  const { api: serverApi } = await import("~/commons/trpc/server");

  return {
    async fetchItemsForCoordinate(params: {
      centerCoordId: string;
      maxDepth: number;
    }) {
      const coords = CoordSystem.parseId(params.centerCoordId);
      return serverApi.map.getItemsForRootItem({
        userId: coords.userId,
        groupId: coords.groupId,
      });
    },

    async getItemByCoordinate(coordId: string) {
      const coords = CoordSystem.parseId(coordId);
      return serverApi.map.getItemByCoords({
        coords: coords as HexCoord,
      });
    },

    async getRootItemById(mapItemId: number) {
      return serverApi.map.getRootItemById({ mapItemId });
    },

    async getDescendants(itemId: number) {
      return serverApi.map.getDescendants({ itemId });
    },

    // Server-side mutations are allowed since they don't conflict with client patterns
    async createItem(params: { coordId: string; data: any }) {
      const coords = CoordSystem.parseId(params.coordId);

      let parentId: number;
      if (params.data.parentId) {
        parentId = parseInt(params.data.parentId);
      } else {
        const parentCoords = CoordSystem.getParentCoord(coords);
        if (!parentCoords) {
          throw new ServiceErrorClass(
            "Cannot determine parent coordinates for this position",
            "INVALID_COORDINATES",
          );
        }

        const parentItem = await serverApi.map.getItemByCoords({
          coords: parentCoords as HexCoord,
        });

        if (!parentItem) {
          throw new ServiceErrorClass(
            `Parent item not found at coordinates ${CoordSystem.createId(parentCoords)}`,
            "PARENT_NOT_FOUND",
          );
        }

        parentId = parseInt(parentItem.id);
      }

      return serverApi.map.addItem({
        coords: coords as HexCoord,
        parentId,
        title: params.data.name || params.data.title || "New Item",
        descr: params.data.description || params.data.descr || "",
        url: params.data.url || "",
      });
    },

    async updateItem(params: { coordId: string; data: any }) {
      const coords = CoordSystem.parseId(params.coordId);
      return serverApi.map.updateItem({
        coords: coords as HexCoord,
        data: {
          title: params.data.name || params.data.title,
          descr: params.data.description || params.data.descr,
          url: params.data.url,
        },
      });
    },

    async deleteItem(params: { coordId: string }) {
      const coords = CoordSystem.parseId(params.coordId);
      await serverApi.map.removeItem({
        coords: coords as HexCoord,
      });
    },
  };
};

// Legacy compatibility (deprecated)
export const createServerService_DEPRECATED = createServerService;
