import { useMapCache } from "./use-map-cache";

/**
 * Convenience hook for navigation operations
 */
export function useMapCacheNavigation() {
  const { 
    navigateToItem, 
    updateCenter, 
    prefetchForNavigation, 
    toggleItemExpansionWithURL 
  } = useMapCache();
  
  return { 
    navigateToItem, 
    updateCenter, 
    prefetchForNavigation, 
    toggleItemExpansionWithURL 
  };
}