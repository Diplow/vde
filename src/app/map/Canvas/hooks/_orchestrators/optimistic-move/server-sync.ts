import type { CacheState } from "~/app/map/Cache/State/types";
import type { ServerModifiedItem } from "./types";
import type { TileData } from "~/app/map/types/tile-data";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { getColor } from "~/app/map/types/tile-data";

/**
 * Synchronizes optimistic updates with server response.
 * Ensures consistency between client and server state.
 */
export interface ServerSynchronizer {
  confirmUpdate: (
    modifiedItems: ServerModifiedItem[],
    updateCache: (updater: (state: CacheState) => CacheState) => void
  ) => void;
}

/**
 * Parses parent ID from server response.
 * Handles both coordinate format and raw IDs.
 */
function _parseParentId(parentId: string | null): string | undefined {
  if (!parentId) {
    return undefined;
  }
  
  try {
    // If parentId is already in coordinate format, use it directly
    if (parentId.includes(',') || parentId.includes(':')) {
      return parentId;
    }
    
    // Otherwise parse and create the coordinate string
    return CoordSystem.createId(CoordSystem.parseId(parentId));
  } catch {
    // Fallback to original value if parsing fails
    return parentId;
  }
}

/**
 * Converts server item to tile data structure.
 * Maps server fields to client tile format.
 */
function _serverItemToTileData(item: ServerModifiedItem): TileData {
  const coords = CoordSystem.parseId(item.coords);
  
  return {
    metadata: {
      dbId: item.id,
      coordId: item.coords,
      coordinates: coords,
      parentId: _parseParentId(item.parentId),
      depth: item.depth,
      ownerId: item.ownerId,
    },
    data: {
      name: item.name,
      description: item.descr,
      url: item.url,
      color: getColor(coords),
    },
    state: {
      isDragged: false,
      isHovered: false,
      isSelected: false,
      isExpanded: false,
      isDragOver: false,
      isHovering: false,
    },
  };
}

/**
 * Confirms server move updates by replacing optimistic changes.
 * Clears modified items and re-adds them with server data.
 */
export function confirmServerMoveUpdate(
  modifiedItems: ServerModifiedItem[],
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((cache) => {
    const updatedItems = { ...cache.itemsById };
    
    // Create set of modified item IDs for efficient lookup
    const modifiedIds = new Set(modifiedItems.map(item => item.id));
    
    // Remove all items that were modified (they might have moved)
    Object.entries(updatedItems).forEach(([coordId, tile]) => {
      if (tile && modifiedIds.has(tile.metadata.dbId)) {
        delete updatedItems[coordId];
      }
    });
    
    // Add all modified items at their confirmed positions
    modifiedItems.forEach(item => {
      updatedItems[item.coords] = _serverItemToTileData(item);
    });
    
    return {
      ...cache,
      itemsById: updatedItems,
    };
  });
}

/**
 * Creates a server synchronizer for move operations.
 * Provides consistent interface for confirming server updates.
 */
export function createServerSynchronizer(): ServerSynchronizer {
  return {
    confirmUpdate: confirmServerMoveUpdate
  };
}