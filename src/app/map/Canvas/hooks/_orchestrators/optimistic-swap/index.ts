import type { OptimisticSwapConfig, CacheSelectors, SwapResult } from "./types";
import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { createCacheRollbackHandler, executeOptimisticUpdate } from "./rollback-handler";
import { createTileSwapOperation } from "./swap-operation";
import { createChildrenRelocationStrategy, updateCacheWithRelocatedChildren } from "./children-relocation";
import { createServerSynchronizer } from "./server-sync";

/**
 * Orchestrates tile swap operations with optimistic updates.
 * Coordinates swap logic, children relocation, and server synchronization.
 */
export async function performOptimisticSwap(config: OptimisticSwapConfig): Promise<void> {
  const {
    tileA,
    tileB,
    cacheState,
    selectors,
    updateCache,
    swapMapItemMutation,
    onSwapComplete
  } = config;
  
  // Early exit if no cache update capability
  if (!updateCache) {
    return performServerOnlySwap(config);
  }
  
  // Create operation handlers
  const rollbackHandler = createCacheRollbackHandler(() => cacheState, updateCache);
  const swapOperation = createTileSwapOperation();
  const childrenRelocation = createChildrenRelocationStrategy();
  const serverSync = createServerSynchronizer();
  
  // Execute optimistic update with automatic rollback on failure
  await executeOptimisticUpdate({
    rollbackHandler,
    
    optimisticUpdate: () => {
      applyOptimisticSwap({
        tileA,
        tileB,
        cacheState,
        selectors,
        updateCache,
        swapOperation,
        childrenRelocation
      });
    },
    
    serverOperation: async (): Promise<SwapResult> => {
      const coordsA = CoordSystem.parseId(tileA.metadata.coordId);
      const coordsB = CoordSystem.parseId(tileB.metadata.coordId);
      
      return await swapMapItemMutation.mutateAsync({
        coordsA,
        coordsB
      });
    },
    
    onSuccess: (result) => {
      serverSync.confirmUpdate(cacheState, result.swappedItems, updateCache);
      onSwapComplete?.();
    },
    
    onError: config.onSwapError
  });
}

/**
 * Applies optimistic swap updates to the cache.
 * Updates parent tiles and relocates all children.
 */
function applyOptimisticSwap(params: {
  tileA: TileData;
  tileB: TileData;
  cacheState: CacheState;
  selectors: CacheSelectors;
  updateCache: (updater: (state: CacheState) => CacheState) => void;
  swapOperation: ReturnType<typeof createTileSwapOperation>;
  childrenRelocation: ReturnType<typeof createChildrenRelocationStrategy>;
}): void {
  const { tileA, tileB, selectors, updateCache, swapOperation, childrenRelocation } = params;
  
  updateCache((cache) => {
    // Swap parent tiles
    const { swappedA, swappedB } = swapOperation.execute(tileA, tileB);
    let updatedCache = swapOperation.updateCache(cache, swappedA, swappedB);
    
    // Relocate children of both tiles
    const childrenA = selectors.getItemChildren(tileA.metadata.coordId);
    const childrenB = selectors.getItemChildren(tileB.metadata.coordId);
    
    if (childrenA.length > 0) {
      const relocatedChildrenA = childrenRelocation.relocateChildren(
        tileA.metadata.coordId,
        tileB.metadata.coordId,
        cache,
        selectors
      );
      updatedCache = updateCacheWithRelocatedChildren(updatedCache, childrenA, relocatedChildrenA);
    }
    
    if (childrenB.length > 0) {
      const relocatedChildrenB = childrenRelocation.relocateChildren(
        tileB.metadata.coordId,
        tileA.metadata.coordId,
        cache,
        selectors
      );
      updatedCache = updateCacheWithRelocatedChildren(updatedCache, childrenB, relocatedChildrenB);
    }
    
    return updatedCache;
  });
}

/**
 * Performs server-only swap without optimistic updates.
 * Used when cache update capability is not available.
 */
async function performServerOnlySwap(config: OptimisticSwapConfig): Promise<void> {
  const { tileA, tileB, swapMapItemMutation, onSwapComplete, onSwapError } = config;
  
  try {
    const coordsA = CoordSystem.parseId(tileA.metadata.coordId);
    const coordsB = CoordSystem.parseId(tileB.metadata.coordId);
    
    await swapMapItemMutation.mutateAsync({
      coordsA,
      coordsB
    });
    
    onSwapComplete?.();
  } catch (error) {
    onSwapError?.(error as Error);
    throw error;
  }
}


// Export all types and utilities for external use
export type { OptimisticSwapConfig } from "./types";
export { createCacheRollbackHandler, executeOptimisticUpdate } from "./rollback-handler";
export type { OptimisticUpdateRollback } from "./rollback-handler";