import { useMapCache } from "./use-map-cache";

/**
 * Convenience hook for mutation operations
 */
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