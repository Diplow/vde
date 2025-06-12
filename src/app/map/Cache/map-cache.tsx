/**
 * Map Cache - Main entry point
 * 
 * This module provides comprehensive client-side caching for hexagonal map data.
 * It orchestrates data loading, mutations, navigation, and synchronization.
 */

// Re-export provider and context
export { MapCacheProvider, MapCacheContext } from "./provider";

// Re-export hooks
export { useMapCache } from "./_hooks/use-map-cache";
export { useMapCacheContext } from "./_hooks/use-cache-context";
export { useMapCacheData } from "./_hooks/use-cache-data";
export { useMapCacheNavigation } from "./_hooks/use-cache-navigation";
export { useMapCacheMutations } from "./_hooks/use-cache-mutations";
export { useMapCacheSync } from "./_hooks/use-cache-sync";

// Re-export types
export type { 
  MapCacheContextValue, 
  MapCacheHook, 
  MapCacheProviderProps 
} from "./types";

// Backward compatibility
import { useMapCache } from "./_hooks/use-map-cache";
export const useCache = useMapCache;