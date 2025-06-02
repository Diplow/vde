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
 * Returns false if:
 * - No hierarchy exists (center is UserMapItem with no parents)
 * - Center is already one of the hierarchy items (we navigated to a parent)
 */
export const _shouldShowHierarchy = (
  hierarchy: HexTileData[],
  currentCenter?: string,
): boolean => {
  // No hierarchy to show
  if (hierarchy.length === 0) {
    return false;
  }

  // If we have a current center and it's one of the items in the hierarchy,
  // then we're already looking at a parent item, so don't show hierarchy
  if (currentCenter) {
    const isViewingHierarchyItem = hierarchy.some(
      (item) => item.metadata.coordId === currentCenter,
    );
    if (isViewingHierarchyItem) {
      return false;
    }
  }

  return true;
};

/**
 * Gets the current center item from the items record
 */
export const _getCenterItem = (
  centerCoordId: string,
  items: Record<string, HexTileData>,
): HexTileData | null => {
  return items[centerCoordId] ?? null;
};
