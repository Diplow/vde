import { useMapCache } from "./use-map-cache";

/**
 * Convenience hook for accessing cache data operations
 */
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