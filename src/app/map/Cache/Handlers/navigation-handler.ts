import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { CacheAction, CacheState } from "../State/types";
import { cacheActions } from "../State/actions";
import type { DataOperations, NavigationOperations } from "./types";

export interface NavigationHandlerConfig {
  dispatch: React.Dispatch<CacheAction>;
  getState: () => CacheState;
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

export interface NavigationOptions {
  pushToHistory?: boolean; // Whether to push to history (true) or replace (false)
}

export function createNavigationHandler(config: NavigationHandlerConfig) {
  const { dispatch, getState, dataHandler, router } = config;

  const navigateToItem = async (
    itemCoordId: string,
    options: NavigationOptions = {},
  ): Promise<NavigationResult> => {
    const { } = options; // Options reserved for future use
    try {
      // 1. Check if we already have the item
      const existingItem = getState().itemsById[itemCoordId];
      
      // 2. Update the cache center first (this changes the view immediately)
      dispatch(cacheActions.setCenter(itemCoordId));
      
      // 3. Only load region data if we don't have it or if it needs more depth
      if (!existingItem || !getState().regionMetadata[itemCoordId]) {
        // Load the region data in the background (without showing loader)
        dataHandler.prefetchRegion(itemCoordId).catch(error => {
          console.error('[NAV] Background region load failed:', error);
        });
      } else {
      }

      let urlUpdated = false;

      // Skip URL updates for now - just update cache state
      urlUpdated = false;

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
    const state = getState();
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
      await dataHandler.loadRegion(itemCoordId, getState().cacheConfig.maxDepth);

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
    const currentPathname = "";
    const currentSearchParams = new URLSearchParams();

    // Extract center item ID from query params
    const centerItemId = currentSearchParams.get("center") ?? "";

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

  const toggleItemExpansionWithURL = (itemId: string): void => {
    if (!router) return;

    const state = getState();
    const centerItem = state.currentCenter
      ? state.itemsById[state.currentCenter]
      : null;

    if (!centerItem) return;

    // Toggle the item in the expanded list
    const currentExpanded = [...state.expandedItemIds];
    const index = currentExpanded.indexOf(itemId);
    
    if (index > -1) {
      currentExpanded.splice(index, 1);
    } else {
      currentExpanded.push(itemId);
    }

    // Update the cache state
    dispatch(cacheActions.toggleItemExpansion(itemId));
    
    // Skip URL updates for now
  };

  return {
    navigateToItem,
    updateCenter,
    updateURL,
    prefetchForNavigation,
    syncURLWithState,
    navigateWithoutURL,
    getMapContext,
    toggleItemExpansionWithURL,
  } as NavigationOperations;
}

// Helper function to build map URLs
function buildMapUrl(centerItemId: string, expandedItems: string[]): string {
  // Handle test environments where window.location.origin might be undefined
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:3000";

  const url = new URL("/map", origin);
  
  // Center is now a query param
  url.searchParams.set("center", centerItemId);

  if (expandedItems.length > 0) {
    url.searchParams.set("expandedItems", expandedItems.join(","));
  }

  return url.pathname + url.search;
}

// Hook-based factory for use in React components
export function useNavigationHandler(
  dispatch: React.Dispatch<CacheAction>,
  getState: () => CacheState,
  dataHandler: DataOperations,
) {
  // Always call hooks unconditionally
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  return createNavigationHandler({
    dispatch,
    getState,
    dataHandler,
    router,
    searchParams,
    pathname,
  });
}

// Factory function for testing with mocked dependencies
export function createNavigationHandlerForTesting(
  dispatch: React.Dispatch<CacheAction>,
  getState: () => CacheState,
  dataHandler: DataOperations,
  mockRouter?: { push: (url: string) => void; replace: (url: string) => void },
  mockSearchParams?: URLSearchParams,
  mockPathname?: string,
) {
  return createNavigationHandler({
    dispatch,
    getState,
    dataHandler,
    router: mockRouter,
    searchParams: mockSearchParams,
    pathname: mockPathname,
  });
}
