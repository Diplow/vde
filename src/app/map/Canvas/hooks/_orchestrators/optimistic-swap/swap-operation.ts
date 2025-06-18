import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import { getColor } from "~/app/map/types/tile-data";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

/**
 * Encapsulates the logic of swapping two tiles' positions.
 * Handles coordinate swapping, color updates, and parent reassignment.
 */
export interface TileSwapOperation {
  execute: (tileA: TileData, tileB: TileData) => { swappedA: TileData; swappedB: TileData };
  updateCache: (cache: CacheState, swappedA: TileData, swappedB: TileData) => CacheState;
}

/**
 * Swaps the positions of two tiles, updating their coordinates and colors.
 * Maintains data consistency by preserving all other tile properties.
 */
export function swapTilePositions(
  tileA: TileData,
  tileB: TileData
): { swappedA: TileData; swappedB: TileData } {
  // Parse coordinates
  const coordsA = CoordSystem.parseId(tileA.metadata.coordId);
  const coordsB = CoordSystem.parseId(tileB.metadata.coordId);
  
  // Swap coordinates
  const newCoordsA = { ...coordsA, path: coordsB.path };
  const newCoordsB = { ...coordsB, path: coordsA.path };
  
  // Create new IDs
  const newIdA = CoordSystem.createId(newCoordsA);
  const newIdB = CoordSystem.createId(newCoordsB);
  
  // Calculate new colors based on new positions
  const newColorA = getColor(newCoordsA);
  const newColorB = getColor(newCoordsB);
  
  // Create swapped tiles with updated properties
  const swappedA: TileData = {
    ...tileA,
    metadata: {
      ...tileA.metadata,
      coordId: newIdA,
      coordinates: newCoordsA,
      parentId: newCoordsA.path.length > 0 
        ? CoordSystem.createId({ ...newCoordsA, path: newCoordsA.path.slice(0, -1) })
        : undefined
    },
    data: {
      ...tileA.data,
      color: newColorA
    }
  };
  
  const swappedB: TileData = {
    ...tileB,
    metadata: {
      ...tileB.metadata,
      coordId: newIdB,
      coordinates: newCoordsB,
      parentId: newCoordsB.path.length > 0
        ? CoordSystem.createId({ ...newCoordsB, path: newCoordsB.path.slice(0, -1) })
        : undefined
    },
    data: {
      ...tileB.data,
      color: newColorB
    }
  };
  
  return { swappedA, swappedB };
}

/**
 * Updates the cache with swapped tiles, replacing old entries with new ones.
 * Maintains cache consistency by updating the tiles map.
 */
export function updateCacheWithSwappedTiles(
  cache: CacheState,
  swappedA: TileData,
  swappedB: TileData,
  originalIdA: string,
  originalIdB: string
): CacheState {
  const updatedItems = { ...cache.itemsById };
  
  // Remove old entries
  delete updatedItems[originalIdA];
  delete updatedItems[originalIdB];
  
  // Add new entries
  updatedItems[swappedA.metadata.coordId] = swappedA;
  updatedItems[swappedB.metadata.coordId] = swappedB;
  
  return {
    ...cache,
    itemsById: updatedItems
  };
}

/**
 * Creates a tile swap operation handler.
 * Combines position swapping and cache update logic.
 */
export function createTileSwapOperation(): TileSwapOperation {
  return {
    execute: swapTilePositions,
    updateCache: (cache, swappedA, swappedB) => {
      // Find the original tiles in cache by checking database IDs
      let originalIdA = '';
      let originalIdB = '';
      
      Object.entries(cache.itemsById).forEach(([id, tile]) => {
        if (tile.metadata.dbId === swappedA.metadata.dbId) {
          originalIdA = id;
        }
        if (tile.metadata.dbId === swappedB.metadata.dbId) {
          originalIdB = id;
        }
      });
      
      return updateCacheWithSwappedTiles(cache, swappedA, swappedB, originalIdA, originalIdB);
    }
  };
}