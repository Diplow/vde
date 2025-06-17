import type { TileData } from "~/app/map/types/tile-data";
import { getColor } from "~/app/map/types/tile-data";
import { CoordSystem, type Coord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { cacheSelectors } from "~/app/map/Cache/State/selectors";

type CacheSelectors = ReturnType<typeof cacheSelectors>;

interface SwapMapItemMutation {
  mutateAsync: (params: {
    coordsA: Coord;
    coordsB: Coord;
  }) => Promise<{
    swappedItems: Array<{
      id: string;
      coords: string;
      depth: number;
      name: string;
      descr: string;
      url: string;
      parentId: string | null;
      itemType: string;
      ownerId: string;
    }>;
  }>;
}

interface OptimisticSwapConfig {
  tileA: TileData;
  tileB: TileData;
  cacheState: CacheState;
  selectors: CacheSelectors;
  updateCache?: (updater: (state: CacheState) => CacheState) => void;
  swapMapItemMutation: SwapMapItemMutation;
  onSwapComplete?: () => void;
  onSwapError?: (error: Error) => void;
}

export async function performOptimisticSwap({
  tileA,
  tileB,
  cacheState,
  selectors,
  updateCache,
  swapMapItemMutation,
  onSwapComplete,
  onSwapError,
}: OptimisticSwapConfig): Promise<void> {
  const coordsA = CoordSystem.parseId(tileA.metadata.coordId);
  const coordsB = CoordSystem.parseId(tileB.metadata.coordId);
  
  if (!coordsA || !coordsB) {
    onSwapError?.(new Error("Invalid coordinates"));
    return;
  }
  
  if (!updateCache) {
    // No optimistic update, just call API
    try {
      await swapMapItemMutation.mutateAsync({
        coordsA,
        coordsB,
      });
      onSwapComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to swap tiles";
      onSwapError?.(new Error(errorMessage));
    }
    return;
  }
  
  // Capture current state for rollback
  const rollbackState = { ...cacheState };
  
  // Optimistically swap the tiles
  updateOptimisticSwap(tileA, tileB, updateCache);
  
  // Swap children recursively
  const childrenA = selectors.getItemChildren(tileA.metadata.coordId);
  const childrenB = selectors.getItemChildren(tileB.metadata.coordId);
  
  if (childrenA.length > 0 || childrenB.length > 0) {
    updateOptimisticSwapChildren(
      tileA.metadata.coordId,
      tileB.metadata.coordId,
      childrenA,
      childrenB,
      coordsA,
      coordsB,
      updateCache
    );
  }
  
  try {
    // Call API
    const result = await swapMapItemMutation.mutateAsync({
      coordsA,
      coordsB,
    });
    
    // Update with server-confirmed values
    confirmServerSwapUpdate(result.swappedItems, updateCache);
    
    onSwapComplete?.();
    
  } catch (error) {
    // Rollback on failure
    updateCache(() => rollbackState);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to swap tiles";
    onSwapError?.(new Error(errorMessage));
  }
}

function updateOptimisticSwap(
  tileA: TileData,
  tileB: TileData,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    const coordsA = tileA.metadata.coordinates;
    const coordsB = tileB.metadata.coordinates;
    const coordIdA = tileA.metadata.coordId;
    const coordIdB = tileB.metadata.coordId;
    
    // Create swapped tiles with updated coordinates and colors
    const swappedTileA: TileData = {
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
    
    const swappedTileB: TileData = {
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
    
    // Update the tiles in their new positions
    updatedItems[coordIdA] = swappedTileB;
    updatedItems[coordIdB] = swappedTileA;
    
    return {
      ...state,
      itemsById: updatedItems,
    };
  });
}

function updateOptimisticSwapChildren(
  oldParentIdA: string,
  oldParentIdB: string,
  childrenA: TileData[],
  childrenB: TileData[],
  newParentCoordsA: Coord,
  newParentCoordsB: Coord,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    // Helper function to move children to new parent
    const moveChildrenToNewParent = (
      children: TileData[],
      oldParentCoords: Coord,
      newParentCoords: Coord,
      newParentId: string
    ) => {
      children.forEach(child => {
        const childCoords = CoordSystem.parseId(child.metadata.coordId);
        // Get the relative path from the old parent
        const relativePath = childCoords.path.slice(oldParentCoords.path.length);
        
        // Create new child coordinates under new parent
        const newChildCoords: Coord = {
          userId: newParentCoords.userId,
          groupId: newParentCoords.groupId,
          path: [...newParentCoords.path, ...relativePath],
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
            parentId: newParentId,
          },
          data: {
            ...child.data,
            color: getColor(newChildCoords),
          },
        };
      });
    };
    
    // Move A's children to B's location
    const coordsA = CoordSystem.parseId(oldParentIdA);
    moveChildrenToNewParent(childrenA, coordsA, newParentCoordsB, oldParentIdB);
    
    // Move B's children to A's location
    const coordsB = CoordSystem.parseId(oldParentIdB);
    moveChildrenToNewParent(childrenB, coordsB, newParentCoordsA, oldParentIdA);
    
    return {
      ...state,
      itemsById: updatedItems,
    };
  });
}

function confirmServerSwapUpdate(
  swappedItems: Array<{
    id: string;
    coords: string;
    parentId: string | null;
  }>,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): void {
  updateCache((state) => {
    const updatedItems = { ...state.itemsById };
    
    swappedItems.forEach(item => {
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