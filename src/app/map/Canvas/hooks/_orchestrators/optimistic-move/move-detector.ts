import type { TileData } from "~/app/map/types/tile-data";
import type { CacheSelectors, MoveOperation } from "./types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

/**
 * Detects whether a move operation is a simple move or a swap.
 * Determines the operation type based on target position occupancy.
 */
export function detectMoveOperation(
  tile: TileData,
  newCoordsId: string,
  selectors: CacheSelectors
): MoveOperation {
  const sourceCoords = CoordSystem.parseId(tile.metadata.coordId);
  const targetCoords = CoordSystem.parseId(newCoordsId);
  
  // Check if target position is occupied
  const targetTile = selectors.getItem(newCoordsId);
  const isSwap = targetTile !== null && targetTile !== undefined;
  
  return {
    type: isSwap ? 'swap' : 'move',
    sourceTile: tile,
    targetTile: isSwap ? targetTile : undefined,
    sourceCoords,
    targetCoords
  };
}

/**
 * Validates that coordinates are valid for a move operation.
 * Returns an error message if invalid, undefined if valid.
 */
export function validateMoveCoordinates(
  operation: MoveOperation
): string | undefined {
  if (!operation.sourceCoords || !operation.targetCoords) {
    return "Invalid coordinates";
  }
  
  // Check if trying to move to the same position
  if (CoordSystem.createId(operation.sourceCoords) === 
      CoordSystem.createId(operation.targetCoords)) {
    return "Cannot move to the same position";
  }
  
  return undefined;
}