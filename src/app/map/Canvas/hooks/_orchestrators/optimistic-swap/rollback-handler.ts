import type { CacheState } from "~/app/map/Cache/State/types";

/**
 * Generic pattern for handling optimistic updates with rollback capability.
 * Captures state before changes and provides rollback on failure.
 */
export interface OptimisticUpdateRollback<T = CacheState> {
  captureState: () => T;
  rollback: (previousState: T) => void;
}

/**
 * Creates a rollback handler for cache state updates.
 * Captures the current state and provides a function to restore it.
 */
export function createCacheRollbackHandler(
  getCurrentState: () => CacheState,
  updateCache: (updater: (state: CacheState) => CacheState) => void
): OptimisticUpdateRollback<CacheState> {
  return {
    captureState: () => getCurrentState(),
    rollback: (previousState) => updateCache(() => previousState)
  };
}

/**
 * Higher-order function that wraps any async operation with rollback capability.
 * Automatically rolls back on error and re-throws for upstream handling.
 */
export async function withRollback<T, R>(
  rollbackHandler: OptimisticUpdateRollback<T>,
  operation: () => Promise<R>
): Promise<R> {
  const previousState = rollbackHandler.captureState();
  
  try {
    return await operation();
  } catch (error) {
    rollbackHandler.rollback(previousState);
    throw error;
  }
}

/**
 * Executes an optimistic update with automatic rollback on failure.
 * Combines state capture, update execution, and error handling.
 */
export async function executeOptimisticUpdate<T, R>(
  config: {
    rollbackHandler: OptimisticUpdateRollback<T>;
    optimisticUpdate: () => void;
    serverOperation: () => Promise<R>;
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
  }
): Promise<R | undefined> {
  const { rollbackHandler, optimisticUpdate, serverOperation, onSuccess, onError } = config;
  
  // Capture state before any changes
  const previousState = rollbackHandler.captureState();
  
  // Apply optimistic update
  optimisticUpdate();
  
  try {
    // Execute server operation
    const result = await serverOperation();
    
    // Call success handler if provided
    onSuccess?.(result);
    
    return result;
  } catch (error) {
    // Rollback optimistic changes
    rollbackHandler.rollback(previousState);
    
    // Call error handler if provided
    onError?.(error as Error);
    
    // Re-throw for upstream handling
    throw error;
  }
}