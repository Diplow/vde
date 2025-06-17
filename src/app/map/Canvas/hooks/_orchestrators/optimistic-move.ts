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
  
  // Optimistically update parent tile
  updateOptimisticParent(tile, newCoordsId, newCoords, updateCache);
  
  // Update children if any
  const children = selectors.getItemChildren(tile.metadata.coordId);
  if (children.length > 0) {
    updateOptimisticChildren(children, newCoords, newCoordsId, updateCache);
  }
  
  try {
    // Call API
    const result = await moveMapItemMutation.mutateAsync({
      oldCoords,
      newCoords,
    });
    
    // Update with server-confirmed values
    confirmServerUpdate(result.modifiedItems, updateCache);
    
    onMoveComplete?.(result.movedItemId);
    
  } catch (error) {
    // Rollback on failure
    updateCache(() => rollbackState);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to move tile";
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

function confirmServerUpdate(
  modifiedItems: Array<{
    id: string;
    coords: string;
    parentId: string | null;
  }>,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    modifiedItems.forEach(item => {
      const existingTile = updatedItems[item.coords];
      if (existingTile) {
        // Update with server-confirmed metadata
        updatedItems[item.coords] = {
          ...existingTile,
          metadata: {
            ...existingTile.metadata,
            dbId: item.id,
            parentId: item.parentId ?? undefined,
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