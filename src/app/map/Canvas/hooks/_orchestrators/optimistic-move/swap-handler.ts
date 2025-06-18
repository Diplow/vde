import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { CacheSelectors } from "./types";
import type { Coord } from "~/lib/domains/mapping/utils/hex-coordinates";
import { performOptimisticSwap } from "../optimistic-swap";
import type { SwapMapItemMutation } from "../optimistic-swap/types";
import type { MoveMapItemMutation, MoveResult } from "./types";

/**
 * Handles swap operations by delegating to the optimistic-swap module.
 * Provides adapter between move and swap interfaces.
 */
export interface SwapHandler {
  executeSwap: (
    tileA: TileData,
    tileB: TileData,
    coordsA: Coord,
    coordsB: Coord,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ) => Promise<void>;
}

/**
 * Adapts move mutation to swap mutation interface.
 * Transforms move parameters to swap parameters.
 */
function adaptMoveToSwapMutation(
  moveMutation: MoveMapItemMutation
): SwapMapItemMutation {
  return {
    mutateAsync: async (params) => {
      // Move mutation uses oldCoords/newCoords, swap uses coordsA/coordsB
      const result: MoveResult = await moveMutation.mutateAsync({
        oldCoords: params.coordsA,
        newCoords: params.coordsB
      });
      
      // Transform result to match swap expectation
      return {
        swappedItems: result.modifiedItems
      };
    }
  };
}

/**
 * Creates a swap handler that uses the optimistic-swap implementation.
 * Reuses existing swap logic for consistency.
 */
export function createSwapHandler(
  cacheState: CacheState,
  selectors: CacheSelectors,
  updateCache: (updater: (state: CacheState) => CacheState) => void,
  moveMutation: MoveMapItemMutation
): SwapHandler {
  const swapMutation = adaptMoveToSwapMutation(moveMutation);
  
  return {
    executeSwap: async (tileA, tileB, coordsA, coordsB, onComplete, onError) => {
      await performOptimisticSwap({
        tileA,
        tileB,
        cacheState,
        selectors,
        updateCache,
        swapMapItemMutation: swapMutation,
        onSwapComplete: onComplete,
        onSwapError: onError
      });
    }
  };
}