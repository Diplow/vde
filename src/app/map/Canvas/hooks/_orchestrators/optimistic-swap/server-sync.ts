import type { CacheState } from "~/app/map/Cache/State/types";
import type { ServerSwapItem } from "./types";
import type { TileData } from "~/app/map/types/tile-data";

/**
 * Confirms optimistic updates with server responses.
 * Ensures consistency between optimistic and actual state.
 */
export interface ServerSynchronizer {
  confirmUpdate: (
    cache: CacheState,
    serverItems: ServerSwapItem[],
    updateCache: (updater: (state: CacheState) => CacheState) => void
  ) => void;
}

/**
 * Maps server response items to cache updates.
 * Only updates fields that might have changed on the server.
 */
function _mapServerItemToTileUpdate(
  serverItem: ServerSwapItem,
  existingTile: TileData | undefined
): Partial<TileData> | null {
  if (!existingTile) return null;
  
  const updates: Partial<TileData> = {};
  
  // Update coordinates if changed
  if (serverItem.coordinates !== existingTile.metadata.coordId) {
    updates.metadata = {
      ...existingTile.metadata,
      coordId: serverItem.coordinates
    };
  }
  
  // Update parent if changed
  if (serverItem.parentId !== existingTile.metadata.parentId) {
    updates.metadata = {
      ...existingTile.metadata,
      ...updates.metadata,
      parentId: serverItem.parentId ?? undefined
    };
  }
  
  // Only return if there are actual updates
  return Object.keys(updates).length > 0 ? updates : null;
}

/**
 * Confirms server swap updates by syncing optimistic changes with server response.
 * Handles partial updates and ensures eventual consistency.
 */
export function confirmServerSwapUpdate(
  cache: CacheState,
  serverItems: ServerSwapItem[],
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((currentCache) => {
    const updatedItems = { ...currentCache.itemsById };
    let hasChanges = false;
    
    serverItems.forEach(serverItem => {
      const existingTile = updatedItems[serverItem.id];
      
      if (existingTile) {
        const updates = _mapServerItemToTileUpdate(serverItem, existingTile);
        
        if (updates) {
          // Apply updates to existing tile
          updatedItems[serverItem.id] = {
            ...existingTile,
            ...updates
          };
          hasChanges = true;
        }
      }
    });
    
    // Only return new state if there were actual changes
    return hasChanges ? { ...currentCache, itemsById: updatedItems } : currentCache;
  });
}

/**
 * Creates a server synchronizer for handling API confirmations.
 * Provides a clean interface for confirming optimistic updates.
 */
export function createServerSynchronizer(): ServerSynchronizer {
  return {
    confirmUpdate: confirmServerSwapUpdate
  };
}