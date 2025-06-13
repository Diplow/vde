import { type api } from "~/commons/trpc/react";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { CacheAction, CacheState } from "../State/types";
import type { MapItemType } from "~/lib/domains/mapping/_objects/map-item";
import { cacheActions } from "../State/actions";
import {
  createServerService,
  type useServerService,
} from "../Services/server-service";
import type { LoadResult } from "./types";

export interface DataHandlerServices {
  server: {
    fetchItemsForCoordinate: (params: {
      centerCoordId: string;
      maxDepth: number;
    }) => Promise<{
      id: string;
      coordinates: string;
      depth: number;
      name: string;
      descr: string;
      url: string;
      parentId: string | null;
      itemType: MapItemType;
      ownerId: string;
    }[]>;
  };
}

export interface DataHandlerConfig {
  dispatch: React.Dispatch<CacheAction>;
  services: DataHandlerServices;
  state: CacheState;
}

export function createDataHandler(config: DataHandlerConfig) {
  const { dispatch, services, state } = config;

  const loadRegion = async (
    centerCoordId: string,
    maxDepth = state.cacheConfig.maxDepth,
  ): Promise<LoadResult> => {
    const regionKey = centerCoordId;

    // Check if we need to load
    const regionMetadata = state.regionMetadata[regionKey];
    const shouldLoad =
      !regionMetadata ||
      isStale(regionMetadata.loadedAt, state.cacheConfig.maxAge) ||
      regionMetadata.maxDepth < maxDepth;

    if (!shouldLoad) {
      return { success: true, itemsLoaded: 0 };
    }

    dispatch(cacheActions.setLoading(true));

    try {
      // Load items relative to the specific coordinate, not from root
      const items = await services.server.fetchItemsForCoordinate({
        centerCoordId,
        maxDepth,
      });

      dispatch(cacheActions.loadRegion(items as Parameters<typeof cacheActions.loadRegion>[0], centerCoordId, maxDepth));

      return { success: true, itemsLoaded: items.length };
    } catch (error) {
      dispatch(cacheActions.setError(error as Error));
      return { success: false, error: error as Error, itemsLoaded: 0 };
    } finally {
      dispatch(cacheActions.setLoading(false));
    }
  };

  const loadItemChildren = async (
    parentCoordId: string,
    maxDepth = 2,
  ): Promise<LoadResult> => {
    dispatch(cacheActions.setLoading(true));

    try {
      // Load children relative to the specific parent coordinate
      const items = await services.server.fetchItemsForCoordinate({
        centerCoordId: parentCoordId,
        maxDepth,
      });

      dispatch(cacheActions.loadItemChildren(items as Parameters<typeof cacheActions.loadItemChildren>[0], parentCoordId, maxDepth));

      return { success: true, itemsLoaded: items.length };
    } catch (error) {
      dispatch(cacheActions.setError(error as Error));
      return { success: false, error: error as Error, itemsLoaded: 0 };
    } finally {
      dispatch(cacheActions.setLoading(false));
    }
  };

  const prefetchRegion = async (centerCoordId: string): Promise<LoadResult> => {
    // Prefetch without showing loading state
    try {
      const items = await services.server.fetchItemsForCoordinate({
        centerCoordId,
        maxDepth: state.cacheConfig.maxDepth,
      });

      dispatch(
        cacheActions.loadRegion(
          items as Parameters<typeof cacheActions.loadRegion>[0],
          centerCoordId,
          state.cacheConfig.maxDepth,
        ),
      );

      return { success: true, itemsLoaded: items.length };
    } catch (error) {
      // Silently fail for prefetch operations
      console.warn("Prefetch failed:", error);
      return { success: false, error: error as Error, itemsLoaded: 0 };
    }
  };

  const invalidateRegion = (regionKey: string) => {
    dispatch(cacheActions.invalidateRegion(regionKey));
  };

  const invalidateAll = () => {
    dispatch(cacheActions.invalidateAll());
  };

  return {
    loadRegion,
    loadItemChildren,
    prefetchRegion,
    invalidateRegion,
    invalidateAll,
  };
}

// Helper function for cache staleness checking
function isStale(lastFetched: number, maxAge: number): boolean {
  return Date.now() - lastFetched > maxAge;
}

// Factory function for creating with server service
export function createDataHandlerWithServerService(
  dispatch: React.Dispatch<CacheAction>,
  state: CacheState,
  serverService: ReturnType<typeof useServerService>,
) {
  const services: DataHandlerServices = {
    server: {
      fetchItemsForCoordinate: serverService.fetchItemsForCoordinate,
    },
  };

  return createDataHandler({ dispatch, services, state });
}

// Pure factory function for easier testing
export function createDataHandlerWithMockableService(
  dispatch: React.Dispatch<CacheAction>,
  state: CacheState,
  utils: ReturnType<typeof api.useUtils>,
  serviceConfig?: Parameters<typeof createServerService>[1],
) {
  const serverService = createServerService(utils, serviceConfig);

  const services: DataHandlerServices = {
    server: {
      fetchItemsForCoordinate: serverService.fetchItemsForCoordinate,
    },
  };

  return createDataHandler({ dispatch, services, state });
}

// Legacy factory function for backwards compatibility
// @deprecated Use createDataHandlerWithServerService instead
export function createDataHandlerWithTRPC(
  dispatch: React.Dispatch<CacheAction>,
  utils: ReturnType<typeof api.useUtils>,
  state: CacheState,
) {
  console.warn(
    "createDataHandlerWithTRPC is deprecated. Use createDataHandlerWithServerService instead.",
  );

  const services: DataHandlerServices = {
    server: {
      fetchItemsForCoordinate: async (params) => {
        // For now, we'll adapt the current API to work with coordinates
        // In the future, this should be a proper API that supports loading from any coordinate
        const coords = CoordSystem.parseId(params.centerCoordId);
        return utils.map.getItemsForRootItem.fetch({
          userId: coords.userId,
          groupId: coords.groupId,
          // TODO: Add centerCoordId and maxDepth parameters to the API
          // centerCoordId: params.centerCoordId,
          // maxDepth: params.maxDepth,
        });
      },
    },
  };

  return createDataHandler({ dispatch, services, state });
}
