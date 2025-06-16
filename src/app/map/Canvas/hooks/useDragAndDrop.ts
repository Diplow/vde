import { useState, useCallback } from "react";
import type { DragEvent } from "react";
import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import { 
  CoordSystem,
  type Coord
} from "~/lib/domains/mapping/utils/hex-coordinates";
import { cacheSelectors } from "~/app/map/Cache/State/selectors";

interface DragState {
  isDragging: boolean;
  draggedTileId: string | null;
  draggedTileData: TileData | null;
  dropTargetId: string | null;
  dragOffset: { x: number; y: number };
}

interface MoveMapItemMutation {
  mutateAsync: (params: {
    oldCoords: Coord;
    newCoords: Coord;
  }) => Promise<{
    modifiedItems: Array<{
      id: string;
      coordinates: string;
      depth: number;
      name: string;
      descr: string;
      url: string;
      parentId: string | null;
      itemType: string;
      ownerId: string;
    }>;
    movedItemId: string;
    affectedCount: number;
  }>;
}

interface UseDragAndDropConfig {
  cacheState: CacheState;
  currentUserId: number | null;
  moveMapItemMutation: MoveMapItemMutation;
  onMoveComplete?: (movedItemId: string) => void;
  onMoveError?: (error: Error) => void;
  updateCache?: (updater: (state: CacheState) => CacheState) => void;
}

const initialDragState: DragState = {
  isDragging: false,
  draggedTileId: null,
  draggedTileData: null,
  dropTargetId: null,
  dragOffset: { x: 0, y: 0 },
};

export function useDragAndDrop({
  cacheState,
  currentUserId,
  moveMapItemMutation,
  onMoveComplete,
  onMoveError,
  updateCache,
}: UseDragAndDropConfig) {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  
  const selectors = cacheSelectors(cacheState);

  const canDragTile = useCallback((coordId: string): boolean => {
    if (!currentUserId) {
      return false;
    }
    
    const tile = selectors.getItem(coordId);
    if (!tile) {
      return false;
    }
    
    // Check ownership (convert to string for comparison)
    if (tile.metadata.ownerId !== String(currentUserId)) {
      return false;
    }
    
    // Check if it's not a root tile (UserTile)
    const coords = CoordSystem.parseId(coordId);
    if (coords.path.length === 0) {
      return false;
    }
    
    return true;
  }, [selectors, currentUserId]);

  const getValidDropTargets = useCallback((draggedTileId: string): string[] => {
    const tile = selectors.getItem(draggedTileId);
    if (!tile) {
      return [];
    }
    
    const coords = CoordSystem.parseId(tile.metadata.coordId);
    
    // Get parent coordinates - if root tile, no valid drop targets
    if (coords.path.length === 0) {
      return [];
    }
    
    const parentCoords = CoordSystem.getParentCoord(coords);
    if (!parentCoords) {
      return [];
    }
    
    
    // Get all child positions from parent
    const siblingCoords = CoordSystem.getChildCoords(parentCoords);
    
    // Find empty sibling positions
    const validTargets: string[] = [];
    for (const siblingCoord of siblingCoords) {
      const siblingId = CoordSystem.createId(siblingCoord);
      const hasItem = selectors.hasItem(siblingId);
      if (!hasItem) {
        validTargets.push(siblingId);
      }
    }
    
    return validTargets;
  }, [selectors]);

  const isValidDropTarget = useCallback((targetCoordId: string): boolean => {
    if (!dragState.draggedTileId) {
      return false;
    }
    
    const validTargets = getValidDropTargets(dragState.draggedTileId);
    return validTargets.includes(targetCoordId);
  }, [dragState.draggedTileId, getValidDropTargets]);

  const handleDragStart = useCallback((coordId: string, event: DragEvent<HTMLDivElement>) => {
    console.log('[DragAndDrop] handleDragStart called for:', coordId);
    
    if (!canDragTile(coordId)) {
      console.log('[DragAndDrop] Cannot drag tile:', coordId);
      event.preventDefault();
      return;
    }
    
    const tile = selectors.getItem(coordId);
    if (!tile) {
      console.log('[DragAndDrop] Tile not found:', coordId);
      return;
    }
    
    console.log('[DragAndDrop] Starting drag for tile:', tile.data.name);
    
    setDragState({
      isDragging: true,
      draggedTileId: coordId,
      draggedTileData: tile,
      dropTargetId: null,
      dragOffset: { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY },
    });
    
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("tileId", coordId);
  }, [canDragTile, selectors]);

  const handleDragOver = useCallback((targetCoordId: string, event: DragEvent<HTMLDivElement>) => {
    if (!isValidDropTarget(targetCoordId)) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    
    setDragState(prev => ({
      ...prev,
      dropTargetId: targetCoordId,
    }));
  }, [isValidDropTarget]);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      dropTargetId: null,
    }));
  }, []);

  const performOptimisticMove = useCallback(async (
    tile: TileData,
    newCoordsId: string,
  ) => {
    const oldCoords = CoordSystem.parseId(tile.metadata.coordId);
    const newCoords = CoordSystem.parseId(newCoordsId);
    
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
    
    // Optimistically update parent tile coordinates
    updateCache((state) => {
      const updatedItems = { ...state.itemsById };
      
      // Remove the tile from its old location
      delete updatedItems[tile.metadata.coordId];
      
      // Add the tile at its new location
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
      };
      
      return {
        ...state,
        itemsById: updatedItems,
      };
    });
    
    // Get immediate children and update their coordinates
    const children = selectors.getItemChildren(tile.metadata.coordId);
    
    if (children.length > 0) {
      updateCache((state) => {
        const updatedItems = { ...state.itemsById };
        
        children.forEach(child => {
          const childCoords = CoordSystem.parseId(child.metadata.coordId);
          // Get the last direction in the path
          const lastDir = childCoords.path[childCoords.path.length - 1];
          if (lastDir !== undefined) {
            // Create new child coordinates by appending the direction to new parent coords
            const newChildCoords: Coord = {
              userId: newCoords.userId,
              groupId: newCoords.groupId,
              path: [...newCoords.path, lastDir],
            };
            const newChildCoordsId = CoordSystem.createId(newChildCoords);
            
            // Remove from old location
            delete updatedItems[child.metadata.coordId];
            
            // Add to new location
            updatedItems[newChildCoordsId] = {
              ...child,
              metadata: {
                ...child.metadata,
                coordId: newChildCoordsId,
                coordinates: newChildCoords,
                parentId: newCoordsId, // Update parent to the new parent coordId
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
    
    try {
      // Call API
      const result = await moveMapItemMutation.mutateAsync({
        oldCoords,
        newCoords,
      });
      
      // Server response confirms the move was successful
      // The optimistic update already moved the items, so we just need to update
      // their metadata with the server-confirmed values (like dbId)
      updateCache((state) => {
        const updatedItems = { ...state.itemsById };
        
        result.modifiedItems.forEach(item => {
          const existingTile = updatedItems[item.coordinates];
          if (existingTile) {
            // Update with server-confirmed metadata
            updatedItems[item.coordinates] = {
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
      
      onMoveComplete?.(result.movedItemId);
      
    } catch (error) {
      // Rollback on failure
      updateCache(() => rollbackState);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to move tile";
      onMoveError?.(new Error(errorMessage));
    }
  }, [cacheState, selectors, updateCache, moveMapItemMutation, onMoveComplete, onMoveError]);

  const handleDrop = useCallback(async (targetCoordId: string, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    
    if (!dragState.draggedTileData || !isValidDropTarget(targetCoordId)) {
      return;
    }
    
    await performOptimisticMove(dragState.draggedTileData, targetCoordId);
    
    // Reset drag state
    setDragState(initialDragState);
  }, [dragState.draggedTileData, isValidDropTarget, performOptimisticMove]);

  const handleDragEnd = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  return {
    dragState,
    dragHandlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
    },
    canDragTile,
    isValidDropTarget,
    isDraggingTile: (id: string) => dragState.draggedTileId === id,
    isDropTarget: (id: string) => dragState.dropTargetId === id,
    isDragging: dragState.isDragging,
  };
}