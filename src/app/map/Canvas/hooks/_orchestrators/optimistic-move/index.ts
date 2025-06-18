import type { OptimisticMoveConfig, MoveOperation } from "./types";
import { createCacheRollbackHandler, executeOptimisticUpdate } from "../optimistic-swap/rollback-handler";
import { detectMoveOperation, validateMoveCoordinates } from "./move-detector";
import { executeSimpleMove } from "./move-operation";
import { createChildrenMigrationStrategy, updateCacheWithMigratedChildren } from "./children-migration";
import { createSwapHandler } from "./swap-handler";
import { createServerSynchronizer } from "./server-sync";

/**
 * Orchestrates tile move operations with optimistic updates.
 * Handles both simple moves and swaps with automatic rollback.
 */
export async function performOptimisticMove(config: OptimisticMoveConfig): Promise<void> {
  const {
    tile,
    newCoordsId,
    selectors,
    updateCache,
    moveMapItemMutation,
    onMoveComplete,
    onMoveError
  } = config;
  
  // Detect operation type
  const operation = detectMoveOperation(tile, newCoordsId, selectors);
  
  // Validate coordinates
  const validationError = validateMoveCoordinates(operation);
  if (validationError) {
    onMoveError?.(new Error(validationError));
    return;
  }
  
  // Early exit if no cache update capability
  if (!updateCache) {
    return performServerOnlyMove(operation, moveMapItemMutation, onMoveComplete, onMoveError);
  }
  
  // Handle swap operations
  if (operation.type === 'swap' && operation.targetTile) {
    return performSwapOperation(config, operation);
  }
  
  // Handle simple move operations
  return performMoveOperation(config, operation);
}

/**
 * Performs a simple move operation with optimistic updates.
 * Moves parent tile and migrates all children.
 */
async function performMoveOperation(
  config: OptimisticMoveConfig,
  operation: MoveOperation
): Promise<void> {
  const { cacheState, selectors, updateCache, moveMapItemMutation, onMoveComplete, onMoveError } = config;
  
  // Create handlers
  const rollbackHandler = createCacheRollbackHandler(() => cacheState, updateCache!);
  const childrenMigration = createChildrenMigrationStrategy();
  const serverSync = createServerSynchronizer();
  
  // Execute optimistic update with automatic rollback
  await executeOptimisticUpdate({
    rollbackHandler,
    
    optimisticUpdate: () => {
      // Move parent tile
      executeSimpleMove(
        operation.sourceTile,
        config.newCoordsId,
        operation.targetCoords,
        updateCache!
      );
      
      // Migrate children if any
      const children = selectors.getItemChildren(operation.sourceTile.metadata.coordId);
      if (children.length > 0) {
        updateCache!((cache) => {
          const migratedChildren = childrenMigration.migrateChildren(
            children,
            operation.targetCoords,
            config.newCoordsId
          );
          return updateCacheWithMigratedChildren(cache, children, migratedChildren);
        });
      }
    },
    
    serverOperation: async () => {
      return await moveMapItemMutation.mutateAsync({
        oldCoords: operation.sourceCoords,
        newCoords: operation.targetCoords
      });
    },
    
    onSuccess: (result) => {
      serverSync.confirmUpdate(result.modifiedItems, updateCache!);
      onMoveComplete?.(result.movedItemId);
    },
    
    onError: (error) => {
      console.error(`Move failed: ${operation.sourceTile.metadata.coordId} -> ${config.newCoordsId}`, {
        operation,
        error: error.message
      });
      onMoveError?.(error);
    }
  });
}

/**
 * Performs a swap operation by delegating to optimistic-swap.
 * Reuses existing swap logic for consistency.
 */
async function performSwapOperation(
  config: OptimisticMoveConfig,
  operation: MoveOperation
): Promise<void> {
  if (!operation.targetTile || !config.updateCache) {
    throw new Error("Invalid swap operation configuration");
  }
  
  const swapHandler = createSwapHandler(
    config.cacheState,
    config.selectors,
    config.updateCache,
    config.moveMapItemMutation
  );
  
  try {
    await swapHandler.executeSwap(
      operation.sourceTile,
      operation.targetTile,
      operation.sourceCoords,
      operation.targetCoords,
      () => config.onMoveComplete?.(operation.sourceTile.metadata.dbId),
      config.onMoveError
    );
  } catch (error) {
    console.error(`Swap failed: ${operation.sourceTile.metadata.coordId} <-> ${operation.targetTile.metadata.coordId}`, {
      operation,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Performs server-only move without optimistic updates.
 * Used when cache update capability is not available.
 */
async function performServerOnlyMove(
  operation: MoveOperation,
  moveMapItemMutation: OptimisticMoveConfig['moveMapItemMutation'],
  onMoveComplete?: (movedItemId: string) => void,
  onMoveError?: (error: Error) => void
): Promise<void> {
  try {
    const result = await moveMapItemMutation.mutateAsync({
      oldCoords: operation.sourceCoords,
      newCoords: operation.targetCoords
    });
    onMoveComplete?.(result.movedItemId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to move tile";
    onMoveError?.(new Error(errorMessage));
  }
}

// Re-export types and utilities for external use
export type { OptimisticMoveConfig, MoveOperation } from "./types";
export { createChildrenMigrationStrategy } from "./children-migration";
export { createServerSynchronizer } from "./server-sync";