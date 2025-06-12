import { useMapCache } from "./use-map-cache";

/**
 * Convenience hook for sync operations
 */
export function useMapCacheSync() {
  const { sync } = useMapCache();
  return sync;
}