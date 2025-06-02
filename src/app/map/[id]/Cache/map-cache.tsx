import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// Core cache infrastructure
import { cacheReducer, initialCacheState } from "./State/reducer";
import { cacheSelectors } from "./State/selectors";
import type { CacheState, CacheAction } from "./State/types";

// Handler layer
import { createDataHandlerWithServerService } from "./Handlers/data-handler";
import { createMutationHandlerForCache } from "./Handlers/mutation-handler";
import { useNavigationHandler } from "./Handlers/navigation-handler";
import type {
  DataOperations,
  MutationOperations,
  NavigationOperations,
  LoadResult,
} from "./Handlers/types";

// Services layer
import { useServerService } from "./Services/server-service";
import { useStorageService } from "./Services/storage-service";
import type { ServerService, StorageService } from "./Services/types";

// Sync engine
import { useSyncEngine } from "./Sync/sync-engine";
import type { SyncOperations, SyncResult, SyncStatus } from "./Sync/types";

// Types
import type { HexTileData } from "../State/types";

// Cache context interface
interface MapCacheContextValue {
  // Core state
  state: CacheState;
  dispatch: React.Dispatch<CacheAction>;

  // Handler operations
  dataOperations: DataOperations;
  mutationOperations: MutationOperations;
  navigationOperations: NavigationOperations;
  syncOperations: SyncOperations;

  // Services (for advanced usage)
  serverService: ServerService;
  storageService: StorageService;
}

// Public hook interface - clean and simple
export interface MapCacheHook {
  // State queries (auto-loading when needed)
  items: Record<string, HexTileData>;
  center: string | null;
  expandedItems: string[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number;

  // Query operations with auto-loading
  getRegionItems: (centerCoordId: string, maxDepth?: number) => HexTileData[];
  hasItem: (coordId: string) => boolean;
  isRegionLoaded: (centerCoordId: string, maxDepth?: number) => boolean;

  // Data operations
  loadRegion: (centerCoordId: string, maxDepth?: number) => Promise<LoadResult>;
  loadItemChildren: (
    parentCoordId: string,
    maxDepth?: number,
  ) => Promise<LoadResult>;
  prefetchRegion: (centerCoordId: string) => Promise<LoadResult>;
  invalidateRegion: (regionKey: string) => void;
  invalidateAll: () => void;

  // Navigation operations
  navigateToItem: (itemCoordId: string) => Promise<void>;
  updateCenter: (centerCoordId: string) => void;
  prefetchForNavigation: (itemCoordId: string) => Promise<void>;

  // Mutation operations (cache coordination only - use tRPC hooks for server mutations)
  createItemOptimistic: (coordId: string, data: any) => Promise<void>;
  updateItemOptimistic: (coordId: string, data: any) => Promise<void>;
  deleteItemOptimistic: (coordId: string) => Promise<void>;
  rollbackOptimisticChange: (changeId: string) => void;
  rollbackAllOptimistic: () => void;
  getPendingOptimisticChanges: () => Array<{
    id: string;
    type: "create" | "update" | "delete";
    coordId: string;
    timestamp: number;
  }>;

  // Sync operations
  sync: {
    isOnline: boolean;
    lastSyncTime: number | null;
    performSync: () => Promise<SyncResult>;
    forceSync: () => Promise<SyncResult>;
    pauseSync: () => void;
    resumeSync: () => void;
    getSyncStatus: () => SyncStatus;
  };

  // Advanced features
  config: {
    maxAge: number;
    backgroundRefreshInterval: number;
    enableOptimisticUpdates: boolean;
    maxDepth: number;
  };
  updateConfig: (config: Partial<MapCacheHook["config"]>) => void;
}

// Provider configuration
export interface MapCacheProviderProps {
  children: ReactNode;

  // Initial state from server-side rendering
  initialItems?: Record<string, HexTileData>;
  initialCenter?: string | null;
  initialExpandedItems?: string[];

  // Map context from URL/route
  mapContext?: {
    rootItemId: number;
    userId: number;
    groupId: number;
  };

  // Cache configuration
  cacheConfig?: Partial<MapCacheHook["config"]>;

  // Service configuration
  serverConfig?: Parameters<typeof useServerService>[0];
  storageConfig?: Parameters<typeof useStorageService>[0];

  // Testing overrides
  testingOverrides?: {
    disableSync?: boolean;
    mockRouter?: any;
    mockSearchParams?: URLSearchParams;
    mockPathname?: string;
  };
}

// Create the context
const MapCacheContext = createContext<MapCacheContextValue | null>(null);

// Context provider component
export function MapCacheProvider({
  children,
  initialItems = {},
  initialCenter = null,
  initialExpandedItems = [],
  mapContext,
  cacheConfig = {},
  serverConfig = {},
  storageConfig = {},
  testingOverrides = {},
}: MapCacheProviderProps) {
  // Initialize cache state with server data
  const initialState: CacheState = useMemo(
    () => ({
      ...initialCacheState,
      itemsById: initialItems,
      currentCenter: initialCenter,
      expandedItemIds: initialExpandedItems,
      lastUpdated: Date.now(),
      cacheConfig: {
        ...initialCacheState.cacheConfig,
        ...cacheConfig,
      },
    }),
    [initialItems, initialCenter, initialExpandedItems, cacheConfig],
  );

  // Core state management
  const [state, dispatch] = useReducer(cacheReducer, initialState);

  // Create a stable state getter that handlers can use
  const getState = useCallback(() => state, [state]);

  // Initialize services
  const serverService = useServerService(serverConfig);
  const storageService = useStorageService(storageConfig);

  // Initialize handlers - use stable references to prevent recreation
  const dataOperations = useMemo(() => {
    // Create a wrapper that provides current state to the handler
    const handler = createDataHandlerWithServerService(
      dispatch,
      state,
      serverConfig,
    );

    // Wrap each method to provide current state
    return {
      loadRegion: async (centerCoordId: string, maxDepth?: number) => {
        const currentState = getState();
        // Recreate handler with current state for this operation
        const currentHandler = createDataHandlerWithServerService(
          dispatch,
          currentState,
          serverConfig,
        );
        return currentHandler.loadRegion(centerCoordId, maxDepth);
      },
      loadItemChildren: async (parentCoordId: string, maxDepth?: number) => {
        const currentState = getState();
        const currentHandler = createDataHandlerWithServerService(
          dispatch,
          currentState,
          serverConfig,
        );
        return currentHandler.loadItemChildren(parentCoordId, maxDepth);
      },
      prefetchRegion: async (centerCoordId: string) => {
        const currentState = getState();
        const currentHandler = createDataHandlerWithServerService(
          dispatch,
          currentState,
          serverConfig,
        );
        return currentHandler.prefetchRegion(centerCoordId);
      },
      invalidateRegion: handler.invalidateRegion,
      invalidateAll: handler.invalidateAll,
    };
  }, [dispatch, serverConfig, getState]);

  const mutationOperations = useMemo(() => {
    // Create a wrapper that provides current state to the handler
    const handler = createMutationHandlerForCache(
      dispatch,
      state,
      dataOperations,
    );

    return {
      createItem: async (coordId: string, data: any) => {
        const currentState = getState();
        const currentHandler = createMutationHandlerForCache(
          dispatch,
          currentState,
          dataOperations,
        );
        return currentHandler.createItem(coordId, data);
      },
      updateItem: async (coordId: string, data: any) => {
        const currentState = getState();
        const currentHandler = createMutationHandlerForCache(
          dispatch,
          currentState,
          dataOperations,
        );
        return currentHandler.updateItem(coordId, data);
      },
      deleteItem: async (coordId: string) => {
        const currentState = getState();
        const currentHandler = createMutationHandlerForCache(
          dispatch,
          currentState,
          dataOperations,
        );
        return currentHandler.deleteItem(coordId);
      },
      rollbackOptimisticChange: handler.rollbackOptimisticChange,
      rollbackAllOptimistic: handler.rollbackAllOptimistic,
      getPendingOptimisticChanges: handler.getPendingOptimisticChanges,
    };
  }, [dispatch, dataOperations, getState]);

  const navigationOperations = useNavigationHandler(
    dispatch,
    state,
    dataOperations,
    testingOverrides.mockRouter,
    testingOverrides.mockSearchParams,
    testingOverrides.mockPathname,
  );

  // Initialize sync engine (if not disabled for testing)
  const syncOperations = useSyncEngine(dispatch, state, dataOperations, {
    enabled: !testingOverrides.disableSync,
    intervalMs: state.cacheConfig.backgroundRefreshInterval,
  });

  // Start sync engine when provider mounts
  useEffect(() => {
    if (!testingOverrides.disableSync) {
      syncOperations.startSync();
      return () => syncOperations.stopSync();
    }
  }, [syncOperations, testingOverrides.disableSync]);

  // Context value
  const contextValue: MapCacheContextValue = useMemo(
    () => ({
      state,
      dispatch,
      dataOperations,
      mutationOperations,
      navigationOperations,
      syncOperations,
      serverService,
      storageService,
    }),
    [
      state,
      dispatch,
      dataOperations,
      mutationOperations,
      navigationOperations,
      syncOperations,
      serverService,
      storageService,
    ],
  );

  return (
    <MapCacheContext.Provider value={contextValue}>
      {children}
    </MapCacheContext.Provider>
  );
}

// Main hook - provides clean public API
export function useMapCache(): MapCacheHook {
  const context = useContext(MapCacheContext);

  if (!context) {
    throw new Error("useMapCache must be used within a MapCacheProvider");
  }

  const {
    state,
    dispatch,
    dataOperations,
    mutationOperations,
    navigationOperations,
    syncOperations,
  } = context;

  // Create selectors with current state
  const selectors = useMemo(() => cacheSelectors(state), [state]);

  // Memoized query operations
  const getRegionItems = useCallback(
    (centerCoordId: string, maxDepth?: number) => {
      return selectors.getRegionItems(centerCoordId, maxDepth);
    },
    [selectors],
  );

  const hasItem = useCallback(
    (coordId: string) => {
      return selectors.hasItem(coordId);
    },
    [selectors],
  );

  const isRegionLoaded = useCallback(
    (centerCoordId: string, maxDepth?: number) => {
      return selectors.isRegionLoaded(centerCoordId, maxDepth);
    },
    [selectors],
  );

  // Mutation operations with better naming for public API
  const createItemOptimistic = useCallback(
    async (coordId: string, data: any) => {
      await mutationOperations.createItem(coordId, data);
    },
    [mutationOperations],
  );

  const updateItemOptimistic = useCallback(
    async (coordId: string, data: any) => {
      await mutationOperations.updateItem(coordId, data);
    },
    [mutationOperations],
  );

  const deleteItemOptimistic = useCallback(
    async (coordId: string) => {
      await mutationOperations.deleteItem(coordId);
    },
    [mutationOperations],
  );

  // Config updates
  const updateConfig = useCallback(
    (newConfig: Partial<MapCacheHook["config"]>) => {
      dispatch({
        type: "UPDATE_CACHE_CONFIG",
        payload: newConfig,
      });
    },
    [dispatch],
  );

  // Navigation operations
  const navigateToItem = useCallback(
    async (itemCoordId: string) => {
      await navigationOperations.navigateToItem(itemCoordId);
    },
    [navigationOperations],
  );

  const updateCenter = useCallback(
    (centerCoordId: string) => {
      navigationOperations.updateCenter(centerCoordId);
    },
    [navigationOperations],
  );

  const prefetchForNavigation = useCallback(
    async (itemCoordId: string) => {
      await navigationOperations.prefetchForNavigation(itemCoordId);
    },
    [navigationOperations],
  );

  // Sync operations with clean interface
  const syncStatus = syncOperations.getSyncStatus();

  return {
    // State queries
    items: state.itemsById,
    center: state.currentCenter,
    expandedItems: state.expandedItemIds,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Query operations
    getRegionItems,
    hasItem,
    isRegionLoaded,

    // Data operations
    loadRegion: dataOperations.loadRegion,
    loadItemChildren: dataOperations.loadItemChildren,
    prefetchRegion: dataOperations.prefetchRegion,
    invalidateRegion: dataOperations.invalidateRegion,
    invalidateAll: dataOperations.invalidateAll,

    // Navigation operations
    navigateToItem,
    updateCenter,
    prefetchForNavigation,

    // Mutation operations (optimistic only)
    createItemOptimistic,
    updateItemOptimistic,
    deleteItemOptimistic,
    rollbackOptimisticChange: mutationOperations.rollbackOptimisticChange,
    rollbackAllOptimistic: mutationOperations.rollbackAllOptimistic,
    getPendingOptimisticChanges: mutationOperations.getPendingOptimisticChanges,

    // Sync operations
    sync: {
      isOnline: syncStatus.isOnline,
      lastSyncTime: syncStatus.lastSyncAt,
      performSync: syncOperations.performSync,
      forceSync: syncOperations.forceSync,
      pauseSync: syncOperations.pauseSync,
      resumeSync: syncOperations.resumeSync,
      getSyncStatus: syncOperations.getSyncStatus,
    },

    // Configuration
    config: state.cacheConfig,
    updateConfig,
  };
}

// Advanced hook for accessing internal context (for debugging/testing)
export function useMapCacheContext(): MapCacheContextValue {
  const context = useContext(MapCacheContext);

  if (!context) {
    throw new Error(
      "useMapCacheContext must be used within a MapCacheProvider",
    );
  }

  return context;
}

// Backward compatibility - legacy hook name
/** @deprecated Use useMapCache instead */
export const useCache = useMapCache;

// Convenience hooks for specific operations
export function useMapCacheData() {
  const {
    items,
    center,
    expandedItems,
    isLoading,
    error,
    getRegionItems,
    hasItem,
  } = useMapCache();
  return {
    items,
    center,
    expandedItems,
    isLoading,
    error,
    getRegionItems,
    hasItem,
  };
}

export function useMapCacheNavigation() {
  const { navigateToItem, updateCenter, prefetchForNavigation } = useMapCache();
  return { navigateToItem, updateCenter, prefetchForNavigation };
}

export function useMapCacheMutations() {
  const {
    createItemOptimistic,
    updateItemOptimistic,
    deleteItemOptimistic,
    rollbackOptimisticChange,
    rollbackAllOptimistic,
    getPendingOptimisticChanges,
  } = useMapCache();
  return {
    createItemOptimistic,
    updateItemOptimistic,
    deleteItemOptimistic,
    rollbackOptimisticChange,
    rollbackAllOptimistic,
    getPendingOptimisticChanges,
  };
}

export function useMapCacheSync() {
  const { sync } = useMapCache();
  return sync;
}

// Export types for external usage
export type { MapCacheContextValue };
