import type { TileData } from "~/app/map/types/tile-data";
import { getColor } from "~/app/map/types/tile-data";
import { CoordSystem, type Coord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { cacheSelectors } from "~/app/map/Cache/State/selectors";
import type { MoveMapItemMutation } from "../types";

type CacheSelectors = ReturnType<typeof cacheSelectors>;

interface OptimisticMoveConfig {
  tile: TileData;
  newCoordsId: string;
  cacheState: CacheState;
  selectors: CacheSelectors;
  updateCache?: (updater: (state: CacheState) => CacheState) => void;
  moveMapItemMutation: MoveMapItemMutation;
  onMoveComplete?: (movedItemId: string) => void;
  onMoveError?: (error: Error) => void;
}

export async function performOptimisticMove({
  tile,
  newCoordsId,
  cacheState,
  selectors,
  updateCache,
  moveMapItemMutation,
  onMoveComplete,
  onMoveError,
}: OptimisticMoveConfig): Promise<void> {
  const oldCoords = CoordSystem.parseId(tile.metadata.coordId);
  const newCoords = CoordSystem.parseId(newCoordsId);
  
  if (!oldCoords || !newCoords) {
    onMoveError?.(new Error("Invalid coordinates"));
    return;
  }
  
  if (!updateCache) {
    // No optimistic update, just call API
    try {
      const result = await moveMapItemMutation.mutateAsync({
        oldCoords,
        newCoords,
      });
      onMoveComplete?.(result.movedItemId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to move tile";
      onMoveError?.(new Error(errorMessage));
    }
    return;
  }
  
  // Capture current state for rollback
  const rollbackState = { ...cacheState };
  
  // Check if this is a swap (target position is occupied)
  const targetTile = selectors.getItem(newCoordsId);
  const isSwap = targetTile !== null && targetTile !== undefined;
  
  if (isSwap) {
    // Handle swap: exchange positions of both tiles
    updateOptimisticSwap(tile, targetTile, oldCoords, newCoords, updateCache, selectors);
  } else {
    // Handle regular move
    updateOptimisticParent(tile, newCoordsId, newCoords, updateCache);
    
    // Update children if any
    const children = selectors.getItemChildren(tile.metadata.coordId);
    if (children.length > 0) {
      updateOptimisticChildren(children, newCoords, newCoordsId, updateCache);
    }
  }
  
  try {
    // Call API
    const result = await moveMapItemMutation.mutateAsync({
      oldCoords,
      newCoords,
    });
    
    // For swaps, skip the server confirmation update
    // Our optimistic update already has the correct state and the server
    // response might not include all the data we need (like proper colors)
    if (!isSwap && updateCache) {
      // For regular moves, update with server data
      confirmServerUpdate(result.modifiedItems, updateCache);
    }
    
    onMoveComplete?.(result.movedItemId);
    
  } catch (error) {
    // Rollback on failure
    updateCache(() => rollbackState);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to move tile";
    console.error(`Move/swap failed: ${tile.metadata.coordId} -> ${newCoordsId}`, {
      isSwap,
      oldCoords,
      newCoords,
      error: errorMessage
    });
    onMoveError?.(new Error(errorMessage));
  }
}

function updateOptimisticParent(
  tile: TileData,
  newCoordsId: string,
  newCoords: Coord,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    // Remove the tile from its old location
    delete updatedItems[tile.metadata.coordId];
    
    // Add the tile at its new location with updated color
    updatedItems[newCoordsId] = {
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
    
    return {
      ...state,
      itemsById: updatedItems,
    };
  });
}

function updateOptimisticChildren(
  children: TileData[],
  newParentCoords: Coord,
  newParentCoordsId: string,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    children.forEach(child => {
      const childCoords = CoordSystem.parseId(child.metadata.coordId);
      // Get the last direction in the path
      const lastDir = childCoords.path[childCoords.path.length - 1];
      if (lastDir !== undefined) {
        // Create new child coordinates by appending the direction to new parent coords
        const newChildCoords: Coord = {
          userId: newParentCoords.userId,
          groupId: newParentCoords.groupId,
          path: [...newParentCoords.path, lastDir],
        };
        const newChildCoordsId = CoordSystem.createId(newChildCoords);
        
        // Remove from old location
        delete updatedItems[child.metadata.coordId];
        
        // Add to new location with updated color
        updatedItems[newChildCoordsId] = {
          ...child,
          metadata: {
            ...child.metadata,
            coordId: newChildCoordsId,
            coordinates: newChildCoords,
            parentId: newParentCoordsId,
          },
          data: {
            ...child.data,
            color: getColor(newChildCoords),
          },
        };
      }
    });
    
    return {
      ...state,
      itemsById: updatedItems,
    };
  });
}

function updateOptimisticSwap(
  tileA: TileData,
  tileB: TileData,
  coordsA: Coord,
  coordsB: Coord,
  updateCache: (updater: (state: CacheState) => CacheState) => void,
  selectors: CacheSelectors
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    const coordIdA = tileA.metadata.coordId;
    const coordIdB = tileB.metadata.coordId;
    
    // Get children before swap
    const childrenA = selectors.getItemChildren(coordIdA);
    const childrenB = selectors.getItemChildren(coordIdB);
    
    // Remove both tiles from their current positions
    delete updatedItems[coordIdA];
    delete updatedItems[coordIdB];
    
    // Swap the tiles
    updatedItems[coordIdB] = {
      ...tileA,
      metadata: {
        ...tileA.metadata,
        coordId: coordIdB,
        coordinates: coordsB,
        parentId: coordsB.path.length > 0 
          ? CoordSystem.createId({
              ...coordsB,
              path: coordsB.path.slice(0, -1)
            })
          : undefined,
      },
      data: {
        ...tileA.data,
        color: getColor(coordsB),
      },
    };
    
    updatedItems[coordIdA] = {
      ...tileB,
      metadata: {
        ...tileB.metadata,
        coordId: coordIdA,
        coordinates: coordsA,
        parentId: coordsA.path.length > 0 
          ? CoordSystem.createId({
              ...coordsA,
              path: coordsA.path.slice(0, -1)
            })
          : undefined,
      },
      data: {
        ...tileB.data,
        color: getColor(coordsA),
      },
    };
    
    // Update children of A to follow their parent to position B
    childrenA.forEach(child => {
      const childCoords = CoordSystem.parseId(child.metadata.coordId);
      const relativePath = childCoords.path.slice(coordsA.path.length);
      const newChildCoords: Coord = {
        ...coordsB,
        path: [...coordsB.path, ...relativePath],
      };
      const newChildId = CoordSystem.createId(newChildCoords);
      
      delete updatedItems[child.metadata.coordId];
      updatedItems[newChildId] = {
        ...child,
        metadata: {
          ...child.metadata,
          coordId: newChildId,
          coordinates: newChildCoords,
          parentId: coordIdB,
        },
        data: {
          ...child.data,
          color: getColor(newChildCoords),
        },
      };
    });
    
    // Update children of B to follow their parent to position A
    childrenB.forEach(child => {
      const childCoords = CoordSystem.parseId(child.metadata.coordId);
      const relativePath = childCoords.path.slice(coordsB.path.length);
      const newChildCoords: Coord = {
        ...coordsA,
        path: [...coordsA.path, ...relativePath],
      };
      const newChildId = CoordSystem.createId(newChildCoords);
      
      delete updatedItems[child.metadata.coordId];
      updatedItems[newChildId] = {
        ...child,
        metadata: {
          ...child.metadata,
          coordId: newChildId,
          coordinates: newChildCoords,
          parentId: coordIdA,
        },
        data: {
          ...child.data,
          color: getColor(newChildCoords),
        },
      };
    });
    
    return {
      ...state,
      itemsById: updatedItems,
    };
  });
}

function confirmServerUpdate(
  modifiedItems: Array<{
    id: string;
    coords: string;
    depth: number;
    name: string;
    descr: string;
    url: string;
    parentId: string | null;
    itemType: string;
    ownerId: string;
  }>,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    // Clear all items that were modified (they might have moved)
    const modifiedIds = new Set(modifiedItems.map(item => item.id));
    Object.entries(updatedItems).forEach(([coordId, tile]) => {
      if (tile && modifiedIds.has(tile.metadata.dbId)) {
        delete updatedItems[coordId];
      }
    });
    
    // Add all modified items at their new positions
    modifiedItems.forEach(item => {
      const coords = CoordSystem.parseId(item.coords);
      
      // For parentId, we need to handle the case where it's already a coordinate string
      let parentId: string | undefined;
      if (item.parentId) {
        try {
          // If parentId is already in coordinate format, use it directly
          if (item.parentId.includes(',') || item.parentId.includes(':')) {
            parentId = item.parentId;
          } else {
            // Otherwise parse and create the coordinate string
            parentId = CoordSystem.createId(CoordSystem.parseId(item.parentId));
          }
        } catch {
          parentId = item.parentId;
        }
      }
        
      updatedItems[item.coords] = {
        metadata: {
          dbId: item.id,
          coordId: item.coords,
          coordinates: coords,
          parentId,
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
    });
    
    return {
      ...state,
      itemsById: updatedItems,
    };
  });
}