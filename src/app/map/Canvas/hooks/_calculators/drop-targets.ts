import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { cacheSelectors } from "~/app/map/Cache/State/selectors";

type CacheSelectors = ReturnType<typeof cacheSelectors>;

export function getValidDropTargets(
  draggedTileId: string,
  selectors: CacheSelectors
): string[] {
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
}

export function isValidDropTarget(
  targetCoordId: string,
  draggedTileId: string | null,
  selectors: CacheSelectors
): boolean {
  if (!draggedTileId) {
    return false;
  }
  
  const validTargets = getValidDropTargets(draggedTileId, selectors);
  return validTargets.includes(targetCoordId);
}