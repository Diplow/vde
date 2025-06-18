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
  let sourceCoords, targetCoords;
  
  try {
    sourceCoords = CoordSystem.parseId(tile.metadata.coordId);
    targetCoords = CoordSystem.parseId(newCoordsId);
  } catch (error) {
    throw new Error(`Failed to parse coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Check if target position is occupied (simplified truthy check)
  const targetTile = selectors.getItem(newCoordsId);
  const isSwap = !!targetTile;
  
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
  try {
    const sourceId = CoordSystem.createId(operation.sourceCoords);
    const targetId = CoordSystem.createId(operation.targetCoords);
    
    if (sourceId === targetId) {
      return "Cannot move to the same position";
    }
  } catch (error) {
    return `Invalid coordinate format: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
  
  return undefined;
}