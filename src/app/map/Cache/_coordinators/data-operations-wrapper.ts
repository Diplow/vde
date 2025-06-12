import { useMemo, useCallback, useRef } from "react";
import type { Dispatch } from "react";
import type { CacheState, CacheAction } from "../State/types";
import type { DataOperations } from "../Handlers/types";
import type { ServerService } from "../Services/types";
import { createDataHandlerWithServerService } from "../Handlers/data-handler";

/**
 * Creates wrapped data operations that always use current state
 */
export function useDataOperationsWrapper(
  dispatch: Dispatch<CacheAction>,
  state: CacheState,
  serverService: ServerService
): DataOperations {
  // Use a ref to avoid recreating the function on every state change
  const stateRef = useRef(state);
  stateRef.current = state;
  const getState = useCallback(() => stateRef.current, []);

  return useMemo(() => {
    // Create a wrapper that provides current state to the handler
    const handler = createDataHandlerWithServerService(
      dispatch,
      state,
      serverService,
    );

    // Wrap each method to provide current state
    return {
      loadRegion: async (centerCoordId: string, maxDepth?: number) => {
        const currentState = getState();
        // Recreate handler with current state for this operation
        const currentHandler = createDataHandlerWithServerService(
          dispatch,
          currentState,
          serverService,
        );
        return currentHandler.loadRegion(centerCoordId, maxDepth);
      },
      loadItemChildren: async (parentCoordId: string, maxDepth?: number) => {
        const currentState = getState();
        const currentHandler = createDataHandlerWithServerService(
          dispatch,
          currentState,
          serverService,
        );
        return currentHandler.loadItemChildren(parentCoordId, maxDepth);
      },
      prefetchRegion: async (centerCoordId: string) => {
        const currentState = getState();
        const currentHandler = createDataHandlerWithServerService(
          dispatch,
          currentState,
          serverService,
        );
        return currentHandler.prefetchRegion(centerCoordId);
      },
      invalidateRegion: handler.invalidateRegion,
      invalidateAll: handler.invalidateAll,
    };
  }, [dispatch, serverService, getState, state]);
}