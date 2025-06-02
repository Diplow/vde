import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { CacheAction, CacheState } from "../State/types";
import { cacheActions } from "../State/actions";
import type { DataOperations } from "./types";

export interface NavigationHandlerConfig {
  dispatch: React.Dispatch<CacheAction>;
  state: CacheState;
  dataHandler: DataOperations;
  // For testing, we can inject these dependencies
  router?: {
    push: (url: string) => void;
    replace: (url: string) => void;
  };
  searchParams?: URLSearchParams;
  pathname?: string;
}

export interface NavigationResult {
  success: boolean;
  error?: Error;
  centerUpdated?: boolean;
  urlUpdated?: boolean;
}

export function createNavigationHandler(config: NavigationHandlerConfig) {
  const { dispatch, state, dataHandler, router, searchParams, pathname } =
    config;

  const navigateToItem = async (
    itemCoordId: string,
  ): Promise<NavigationResult> => {
    try {
      // 1. Pre-load the target region if needed
      await dataHandler.loadRegion(itemCoordId, state.cacheConfig.maxDepth);

      // 2. Update the cache center
      dispatch(cacheActions.setCenter(itemCoordId));

      // 3. Update URL coordination - use the item if it exists
      const item = state.itemsById[itemCoordId];
      let urlUpdated = false;

      if (item && router) {
        const newUrl = buildMapUrl(item.metadata.dbId, state.expandedItemIds);
        router.push(newUrl);
        urlUpdated = true;
      }

      return {
        success: true,
        centerUpdated: true,
        urlUpdated,
      };
    } catch (error) {
      const errorObj = error as Error;
      dispatch(cacheActions.setError(errorObj));

      return {
        success: false,
        error: errorObj,
        centerUpdated: false,
        urlUpdated: false,
      };
    }
  };

  const updateCenter = (centerCoordId: string): void => {
    dispatch(cacheActions.setCenter(centerCoordId));
  };

  const updateURL = (centerItemId: string, expandedItems: string[]): void => {
    if (router) {
      const newUrl = buildMapUrl(centerItemId, expandedItems);
      router.push(newUrl);
    }
  };

  const prefetchForNavigation = async (itemCoordId: string): Promise<void> => {
    // Prefetch without affecting current state
    await dataHandler.prefetchRegion(itemCoordId);
  };

  const syncURLWithState = (): void => {
    const centerItem = state.currentCenter
      ? state.itemsById[state.currentCenter]
      : null;

    if (centerItem && router) {
      const newUrl = buildMapUrl(
        centerItem.metadata.dbId,
        state.expandedItemIds,
      );
      router.replace(newUrl);
    }
  };

  const navigateWithoutURL = async (
    itemCoordId: string,
  ): Promise<NavigationResult> => {
    try {
      // Load region if needed
      await dataHandler.loadRegion(itemCoordId, state.cacheConfig.maxDepth);

      // Update only cache center, not URL
      dispatch(cacheActions.setCenter(itemCoordId));

      return {
        success: true,
        centerUpdated: true,
        urlUpdated: false,
      };
    } catch (error) {
      const errorObj = error as Error;
      dispatch(cacheActions.setError(errorObj));

      return {
        success: false,
        error: errorObj,
        centerUpdated: false,
        urlUpdated: false,
      };
    }
  };

  const getMapContext = () => {
    const currentPathname = pathname || "";
    const currentSearchParams = searchParams || new URLSearchParams();

    // Extract center item ID from pathname (e.g., /map/123 -> "123")
    const pathParts = currentPathname.split("/");
    const centerItemId = pathParts[pathParts.length - 1] || "";

    // Parse expanded items from query parameters
    const expandedItemsParam = currentSearchParams.get("expandedItems");
    const expandedItems = expandedItemsParam
      ? expandedItemsParam.split(",").filter(Boolean)
      : [];

    return {
      centerItemId,
      expandedItems,
      pathname: currentPathname,
      searchParams: currentSearchParams,
    };
  };

  return {
    navigateToItem,
    updateCenter,
    updateURL,
    prefetchForNavigation,
    syncURLWithState,
    navigateWithoutURL,
    getMapContext,
  };
}

// Helper function to build map URLs
function buildMapUrl(centerItemId: string, expandedItems: string[]): string {
  // Handle test environments where window.location.origin might be undefined
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:3000";

  const url = new URL(`/map/${centerItemId}`, origin);

  if (expandedItems.length > 0) {
    url.searchParams.set("expandedItems", expandedItems.join(","));
  }

  return url.pathname + url.search;
}

// Hook-based factory for use in React components - with optional overrides
export function useNavigationHandler(
  dispatch: React.Dispatch<CacheAction>,
  state: CacheState,
  dataHandler: DataOperations,
  mockRouter?: any,
  mockSearchParams?: URLSearchParams,
  mockPathname?: string,
) {
  // Only call hooks if we don't have mocked values
  const router = mockRouter ? null : useRouter();
  const searchParams = mockSearchParams ? null : useSearchParams();
  const pathname = mockPathname ? null : usePathname();

  return createNavigationHandler({
    dispatch,
    state,
    dataHandler,
    router: mockRouter || router,
    searchParams: mockSearchParams || searchParams,
    pathname: mockPathname || pathname,
  });
}

// Factory function for testing with mocked dependencies
export function createNavigationHandlerForTesting(
  dispatch: React.Dispatch<CacheAction>,
  state: CacheState,
  dataHandler: DataOperations,
  mockRouter?: { push: (url: string) => void; replace: (url: string) => void },
  mockSearchParams?: URLSearchParams,
  mockPathname?: string,
) {
  return createNavigationHandler({
    dispatch,
    state,
    dataHandler,
    router: mockRouter,
    searchParams: mockSearchParams,
    pathname: mockPathname,
  });
}
