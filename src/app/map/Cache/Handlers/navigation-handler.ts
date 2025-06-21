import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { CacheAction, CacheState } from "../State/types";
import { cacheActions } from "../State/actions";
import type { DataOperations, NavigationOperations } from "./types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

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
      
      // 2. Collapse tiles that are more than 1 generation away from the new center
      const currentState = getState();
      const newCenterDepth = CoordSystem.getDepthFromId(itemCoordId);
      
      // Get the dbId of the new center if it exists
      const newCenterItem = currentState.itemsById[itemCoordId];
      const newCenterDbId = newCenterItem?.metadata.dbId;
      
      // Build a map of dbId -> coordId for all items
      const dbIdToCoordId: Record<string, string> = {};
      Object.values(currentState.itemsById).forEach(item => {
        dbIdToCoordId[item.metadata.dbId] = item.metadata.coordId;
      });
      
      // Filter expanded items (which are dbIds) to keep only those within 1 generation
      const filteredExpandedDbIds = currentState.expandedItemIds.filter(expandedDbId => {
        // Get the coordId for this dbId
        const expandedCoordId = dbIdToCoordId[expandedDbId];
        if (!expandedCoordId) {
          // If we don't have the item data, keep it for now
          return true;
        }
        
        // Keep the new center itself if it was expanded
        if (newCenterDbId && expandedDbId === newCenterDbId) {
          return true;
        }
        
        // Check if the expanded item is a descendant of the new center
        // Need to handle the case where center has no path (e.g., "1,0")
        const isDescendant = itemCoordId.includes(":") 
          ? expandedCoordId.startsWith(itemCoordId + ",") || expandedCoordId === itemCoordId
          : expandedCoordId.startsWith(itemCoordId + ":");
          
        if (isDescendant) {
          // It's a descendant - check generation distance
          const expandedDepth = CoordSystem.getDepthFromId(expandedCoordId);
          const generationDistance = expandedDepth - newCenterDepth;
          const keep = generationDistance <= 1;
          return keep;
        }
        
        // Check if the new center is a descendant of the expanded item
        // Need to handle the case where expanded has no path (e.g., "1,0")
        const isAncestor = expandedCoordId.includes(":")
          ? itemCoordId.startsWith(expandedCoordId + ",") || itemCoordId === expandedCoordId
          : itemCoordId.startsWith(expandedCoordId + ":");
          
        if (isAncestor) {
          // The expanded item is an ancestor of the new center - keep ALL ancestors expanded
          return true;
        }
        
        // For items that are neither ancestors nor descendants, collapse them
        return false;
      });
      
      // Update expanded items if there are changes
      if (filteredExpandedDbIds.length !== currentState.expandedItemIds.length) {
        dispatch(cacheActions.setExpandedItems(filteredExpandedDbIds));
      }
      
      // 3. Update the cache center (this changes the view immediately)
      dispatch(cacheActions.setCenter(itemCoordId));
      
      // 4. Only load region data if we don't have it or if it needs more depth
      if (!existingItem || !getState().regionMetadata[itemCoordId]) {
        // Load the region data in the background (without showing loader)
        dataHandler.prefetchRegion(itemCoordId).catch(error => {
          console.error('[NAV] Background region load failed:', error);
        });
      } else {
      }

      let urlUpdated = false;

      // Update URL with new center and filtered expanded items
      if (router && existingItem) {
        const newUrl = buildMapUrl(
          existingItem.metadata.dbId,
          filteredExpandedDbIds,
        );
        
        // Use push or replace based on navigation options
        if (options.pushToHistory ?? true) {
          router.push(newUrl);
        } else {
          router.replace(newUrl);
        }
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
    if (!router) {
      return;
    }

    const state = getState();
    const centerItem = state.currentCenter
      ? state.itemsById[state.currentCenter]
      : null;

    if (!centerItem) {
      return;
    }

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
    
    // Update URL using replaceState to avoid adding to browser history
    const newUrl = buildMapUrl(
      centerItem.metadata.dbId,
      currentExpanded,
    );
    router.replace(newUrl);
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
