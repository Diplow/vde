import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { HexTileData } from "../../State/types";

/**
 * Builds the parent hierarchy chain from root to direct parent (excluding current center)
 */
export const _getParentHierarchy = (
  centerCoordId: string,
  items: Record<string, HexTileData>,
): HexTileData[] => {
  const hierarchy: HexTileData[] = [];
  let currentCoordId = centerCoordId;

  // Traverse up the parent chain
  while (true) {
    const parentCoordId = CoordSystem.getParentCoordFromId(currentCoordId);
    if (!parentCoordId) {
      break; // Reached the root (no parent)
    }

    const parentItem = items[parentCoordId];
    if (!parentItem) {
      break; // Parent item not found in the items record
    }

    hierarchy.unshift(parentItem); // Add to front to maintain root-to-parent order
    currentCoordId = parentCoordId;
  }

  return hierarchy;
};

/**
 * Checks if the given item is a UserMapItem center (has no parent)
 */
export const _isUserMapCenter = (item: HexTileData): boolean => {
  return item.metadata.coordinates.path.length === 0;
};

/**
 * Determines if the hierarchy should be displayed
 * Returns false if center is UserMapItem (no parents), true otherwise
 */
export const _shouldShowHierarchy = (hierarchy: HexTileData[]): boolean => {
  return hierarchy.length > 0;
};

/**
 * Gets the current center item from the items record
 */
export const _getCenterItem = (
  centerCoordId: string,
  items: Record<string, HexTileData>,
): HexTileData | null => {
  return items[centerCoordId] || null;
};
