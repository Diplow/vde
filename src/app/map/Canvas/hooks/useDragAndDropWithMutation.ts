import { api } from "~/commons/trpc/react";
import { useAuth } from "~/contexts/AuthContext";
import { useMapCacheContext } from "../../Cache/map-cache";
import { useDragAndDrop } from "./useDragAndDrop";
import { ACTION_TYPES } from "../../Cache/State/types";
import type { CacheState } from "../../Cache/State/types";

/**
 * Hook that combines drag and drop functionality with tRPC mutation
 * This wraps the useDragAndDrop hook and provides the mutation integration
 */
export function useDragAndDropWithMutation() {
  const { state: cacheState, dispatch } = useMapCacheContext();
  const { mappingUserId } = useAuth();
  
  // Initialize the moveMapItem mutation
  const moveMapItemMutation = api.map.items.moveMapItem.useMutation({
    onSuccess: () => {
      // Don't invalidate region - our optimistic update is already correct
      // and invalidating would cause a reload that might get stale data
    },
    onError: (error: unknown) => {
      console.error('Failed to move item:', error);
      // TODO: Show error toast or notification
    },
  });
  
  // Initialize drag and drop with the mutation
  const {
    dragHandlers,
    canDragTile,
    isDraggingTile,
    isDropTarget,
    isValidDropTarget,
    isDragging,
  } = useDragAndDrop({
    cacheState,
    currentUserId: mappingUserId ?? null,
    moveMapItemMutation,
    onMoveComplete: (_movedItemId) => {
      // Move completed successfully
    },
    onMoveError: (error) => {
      console.error('Failed to move tile:', error);
      // TODO: Show error toast or notification
    },
    updateCache: (updater) => {
      // Get the updated state from the updater function
      const newState = updater(cacheState);
      
      // Calculate the differences between old and new state
      const updates: Record<string, CacheState['itemsById'][string] | undefined> = {};
      
      // Find items to delete (in old state but not in new)
      Object.keys(cacheState.itemsById).forEach(coordId => {
        if (!newState.itemsById[coordId]) {
          updates[coordId] = undefined;
        }
      });
      
      // Find items to add or update (in new state)
      Object.entries(newState.itemsById).forEach(([coordId, item]) => {
        const oldItem = cacheState.itemsById[coordId];
        if (!oldItem || oldItem !== item) {
          updates[coordId] = item;
        }
      });
      
      // Dispatch the update
      if (Object.keys(updates).length > 0) {
        dispatch({
          type: ACTION_TYPES.UPDATE_ITEMS,
          payload: updates,
        });
      }
    },
  });
  
  return {
    dragHandlers,
    canDragTile,
    isDraggingTile,
    isDropTarget,
    isValidDropTarget,
    isDragging,
  };
}