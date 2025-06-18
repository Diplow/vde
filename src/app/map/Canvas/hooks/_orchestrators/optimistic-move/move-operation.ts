import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import { getColor } from "~/app/map/types/tile-data";
import { CoordSystem, type Coord } from "~/lib/domains/mapping/utils/hex-coordinates";

/**
 * Moves a single tile to a new position.
 * Updates coordinates, color, and parent relationship.
 */
export function moveTileToPosition(
  tile: TileData,
  newCoordsId: string,
  newCoords: Coord
): TileData {
  return {
    ...tile,
    metadata: {
      ...tile.metadata,
      coordId: newCoordsId,
      coordinates: newCoords,
      parentId: newCoords.path.length > 0 
        ? CoordSystem.createId({
            ...newCoords,
            path: newCoords.path.slice(0, -1)
          })
        : undefined,
    },
    data: {
      ...tile.data,
      color: getColor(newCoords),
    },
  };
}

/**
 * Updates cache with a moved tile.
 * Removes from old position and adds to new position.
 */
export function updateCacheWithMovedTile(
  cache: CacheState,
  oldCoordsId: string,
  movedTile: TileData
): CacheState {
  const updatedItems = { ...cache.itemsById };
  
  // Remove from old location
  delete updatedItems[oldCoordsId];
  
  // Add to new location
  updatedItems[movedTile.metadata.coordId] = movedTile;
  
  return {
    ...cache,
    itemsById: updatedItems,
  };
}

/**
 * Performs a simple move operation on a tile.
 * Combines position update and cache update.
 */
export function executeSimpleMove(
  tile: TileData,
  newCoordsId: string,
  newCoords: Coord,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((cache) => {
    const movedTile = moveTileToPosition(tile, newCoordsId, newCoords);
    return updateCacheWithMovedTile(cache, tile.metadata.coordId, movedTile);
  });
}