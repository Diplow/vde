// ==============================================================================
// Map Cache - Complete Cache System for Frontend
// ==============================================================================
//
// This module provides a comprehensive cache system for map data with:
// - Pure reducer-based state management
// - Service-oriented external integrations
// - Handler-coordinated operations
// - Background synchronization (placeholder - not yet implemented)
// - Comprehensive testing support
//
// Architecture:
// - State Layer: Pure reducer, actions, selectors
// - Handlers Layer: Data, mutation, navigation coordination
// - Services Layer: Server communication and localStorage
// - Sync Layer: Background synchronization (placeholder implementation)
// - Provider Layer: React context integration
//
// Current Status:
// - URL coordination: Implemented in navigation handler
// - Background sync: Placeholder implementation with tests
// - Optimistic updates: Fully implemented
// - Offline support: localStorage persistence works, offline queue not yet implemented
//
// ==============================================================================

import React from "react";

// Main provider and hooks - Primary API
export {
  MapCacheProvider,
  MapCacheContext,
  useMapCache,
  useMapCacheContext,
  useMapCacheData,
  useMapCacheNavigation,
  useMapCacheMutations,
  useMapCacheSync,
  // Backward compatibility
  useCache,
} from "./map-cache";

// Import the types we need for the utility functions
import { MapCacheProvider as MapCacheProviderComponent } from "./map-cache";
import type { MapCacheHook, MapCacheProviderProps } from "./map-cache";

// Provider and hook types
export type { MapCacheHook, MapCacheProviderProps, MapCacheContextValue } from "./map-cache";

// ==============================================================================
// State Layer - Pure state management
// ==============================================================================

// Actions and action creators
export { cacheActions } from "./State/actions";
export {
  loadRegion,
  loadItemChildren,
  setCenter,
  setExpandedItems,
  toggleItemExpansion,
  setLoading,
  setError,
  invalidateRegion,
  invalidateAll,
  updateCacheConfig,
} from "./State/actions";

// Pure reducer
export { cacheReducer, initialCacheState } from "./State/reducer";

// Selectors
export { cacheSelectors, defaultSelectors } from "./State/selectors";
export type { CacheSelectors, CacheSelectorFunction } from "./State/selectors";

// State types
export type {
  CacheState,
  CacheAction,
  RegionMetadata,
  LoadRegionPayload,
  LoadItemChildrenPayload,
  UpdateCacheConfigPayload,
} from "./State/types";

// ==============================================================================
// Handlers Layer - Operation coordination
// ==============================================================================

// Data handler - coordinates data loading
export {
  createDataHandler,
  createDataHandlerWithServerService,
  createDataHandlerWithMockableService,
} from "./Handlers/data-handler";

// Mutation handler - coordinates optimistic updates
export {
  createMutationHandler,
  createMutationHandlerForCache,
} from "./Handlers/mutation-handler";

// Navigation handler - coordinates navigation and URL updates
export {
  createNavigationHandler,
  useNavigationHandler,
  createNavigationHandlerForTesting,
} from "./Handlers/navigation-handler";

// Handler types
export type {
  DataOperations,
  MutationOperations,
  NavigationOperations,
  HandlerConfig,
  HandlerServices,
  LoadResult,
  NavigationResult,
  MutationResult,
} from "./Handlers/types";

// ==============================================================================
// Services Layer - External integrations
// ==============================================================================

// Server service - query-only server communication
export {
  createServerService,
  useServerService,
  createServerServiceFactory,
  createMockServerService,
} from "./Services/server-service";

// Storage service - persistence and local storage
export {
  createStorageService,
  useStorageService,
  createBrowserStorageService,
  createSSRStorageService,
  createMockStorageService,
  createNoOpStorageService,
  STORAGE_KEYS,
} from "./Services/storage-service";

// Service types and errors
export { ServiceError, NetworkError, TimeoutError } from "./Services/types";

export type {
  ServerService,
  StorageService,
  ServiceConfig,
  ServiceFactory,
} from "./Services/types";

// ==============================================================================
// Sync Layer - Background synchronization
// ==============================================================================

// Sync engine - background data synchronization
export {
  createSyncEngine,
  useSyncEngine,
  createSyncEngineForTesting,
} from "./Sync/sync-engine";

// Sync types
export type {
  SyncOperations,
  SyncConfig,
  SyncStatus,
  SyncResult,
  SyncEvent,
  SyncEventHandler,
} from "./Sync/types";

// ==============================================================================
// Utility exports and convenience functions
// ==============================================================================

// Factory functions for testing
export const createTestCacheProvider = (
  props: Partial<MapCacheProviderProps> = {},
) => {
  const defaultProps: MapCacheProviderProps = {
    children: null,
    testingOverrides: {
      disableSync: true,
    },
    ...props,
  };

  const TestProvider = ({ children }: { children: React.ReactNode }) => (
    <MapCacheProviderComponent {...defaultProps}>{children}</MapCacheProviderComponent>
  );
  TestProvider.displayName = 'TestMapCacheProvider';
  return TestProvider;
};

// Cache health check utilities
export const createCacheHealthCheck = (cache: MapCacheHook) => ({
  hasItems: Object.keys(cache.items).length > 0,
  hasCenter: !!cache.center,
  hasErrors: !!cache.error,
  isLoading: cache.isLoading,
  syncStatus: cache.sync.getSyncStatus(),
  config: cache.config,
});

// Testing utilities
export const createMockCacheData = () => ({
  items: {},
  center: null,
  expandedItems: [],
  isLoading: false,
  error: null,
  lastUpdated: Date.now(),
});

// ==============================================================================
// Re-exports from dependencies for convenience
// ==============================================================================

// Common types that consumers will need
export type { TileData } from "../types/tile-data";
export type { MapItemAPIContract } from "~/server/api/types/contracts";

// ==============================================================================
// Version and metadata
// ==============================================================================

export const CACHE_VERSION = "2.0.0";
export const CACHE_ARCHITECTURE = "reducer-handler-service-sync";

// Feature flags for progressive enhancement
export const CACHE_FEATURES = {
  OPTIMISTIC_UPDATES: true,        // Fully implemented
  BACKGROUND_SYNC: false,          // Placeholder implementation only
  PERSISTENT_STORAGE: true,        // localStorage implemented
  URL_COORDINATION: true,          // Implemented in navigation handler
  ERROR_RECOVERY: true,            // Basic error handling implemented
  PERFORMANCE_MONITORING: false,   // Not yet implemented
  OFFLINE_QUEUE: false,           // Not yet implemented
} as const;

// ==============================================================================
// Documentation and examples
// ==============================================================================

/**
 * Quick Start Example:
 *
 * ```tsx
 * import { MapCacheProvider, useMapCache } from '~/app/map/Cache';
 *
 * function App() {
 *   return (
 *     <MapCacheProvider
 *       initialItems={serverItems}
 *       initialCenter="1,2:0"
 *       mapContext={{
 *         rootItemId: 1,
 *         userId: 1,
 *         groupId: 2
 *       }}
 *       cacheConfig={{ maxDepth: 3 }}
 *     >
 *       <MapComponent />
 *     </MapCacheProvider>
 *   );
 * }
 *
 * function MapComponent() {
 *   const cache = useMapCache();
 *
 *   const handleNavigate = async () => {
 *     await cache.navigateToItem("1,2:1");
 *   };
 *
 *   const handleCreate = async () => {
 *     await cache.createItemOptimistic("1,2:1,3", {
 *       title: "New Item",
 *       description: "Created via cache"
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       Items: {Object.keys(cache.items).length}
 *       <button onClick={handleNavigate}>Navigate</button>
 *       <button onClick={handleCreate}>Create Item</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * Testing Example:
 *
 * ```tsx
 * import { renderHook } from '@testing-library/react';
 * import { MapCacheProvider, useMapCache } from '~/app/map/Cache';
 *
 * test('cache works correctly', () => {
 *   const { result } = renderHook(() => useMapCache(), {
 *     wrapper: ({ children }) => (
 *       <MapCacheProvider 
 *         testingOverrides={{ disableSync: true }}
 *         mapContext={{ rootItemId: 1, userId: 1, groupId: 2 }}
 *       >
 *         {children}
 *       </MapCacheProvider>
 *     ),
 *   });
 *
 *   expect(result.current.items).toBeDefined();
 *   expect(result.current.center).toBeNull();
 * });
 * ```
 */
