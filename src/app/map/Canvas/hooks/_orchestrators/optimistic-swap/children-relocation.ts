import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { CacheSelectors } from "./types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { getColor } from "~/app/map/types/tile-data";

/**
 * Manages how child tiles follow their parent during swaps.
 * Calculates relative paths and applies them to new parent location.
 */
export interface ChildrenRelocationStrategy {
  relocateChildren: (
    fromParentId: string,
    toParentId: string,
    cache: CacheState,
    selectors: CacheSelectors
  ) => TileData[];
}

/**
 * Calculates the relative path from one coordinate to another.
 * Used to maintain child positions relative to their parent.
 */
function _calculateRelativePath(childPath: number[], parentPath: number[]): number[] {
  return childPath.slice(parentPath.length);
}

/**
 * Applies a relative path to a new parent coordinate.
 * Reconstructs the absolute path for a child at its new location.
 */
function _applyRelativePathToNewParent(
  relativePath: number[],
  newParentPath: number[]
): number[] {
  return [...newParentPath, ...relativePath];
}

/**
 * Relocates all children from one parent to another.
 * Preserves relative positions while updating absolute coordinates.
 */
export function relocateChildrenToNewParent(
  fromParentId: string,
  toParentId: string,
  cache: CacheState,
  selectors: CacheSelectors
): TileData[] {
  const fromCoords = CoordSystem.parseId(fromParentId);
  const toCoords = CoordSystem.parseId(toParentId);
  
  // Get all children of the source parent
  const children = selectors.getItemChildren(fromParentId);
  
  return children.map((child: TileData) => {
    const childCoords = CoordSystem.parseId(child.metadata.coordId);
    
    // Calculate relative position from old parent
    const relativePath = _calculateRelativePath(childCoords.path, fromCoords.path);
    
    // Apply relative path to new parent
    const newPath = _applyRelativePathToNewParent(relativePath, toCoords.path);
    
    // Create new coordinates
    const newCoords = { ...childCoords, path: newPath };
    const newId = CoordSystem.createId(newCoords);
    
    // Calculate new color based on new coordinates
    const newColor = getColor(newCoords);
    
    // Return updated child tile
    return {
      ...child,
      metadata: {
        ...child.metadata,
        coordId: newId,
        coordinates: newCoords,
        parentId: newPath.length > 0
          ? CoordSystem.createId({ ...newCoords, path: newPath.slice(0, -1) })
          : undefined
      },
      data: {
        ...child.data,
        color: newColor
      }
    };
  });
}

/**
 * Updates cache with relocated children, handling both additions and removals.
 * Ensures cache consistency during bulk child updates.
 */
export function updateCacheWithRelocatedChildren(
  cache: CacheState,
  oldChildren: TileData[],
  newChildren: TileData[]
): CacheState {
  const updatedItems = { ...cache.itemsById };
  
  // Remove old child entries
  oldChildren.forEach(child => {
    delete updatedItems[child.metadata.coordId];
  });
  
  // Add new child entries
  newChildren.forEach(child => {
    updatedItems[child.metadata.coordId] = child;
  });
  
  return {
    ...cache,
    itemsById: updatedItems
  };
}

/**
 * Creates a children relocation strategy handler.
 * Encapsulates the logic for moving entire subtrees.
 */
export function createChildrenRelocationStrategy(): ChildrenRelocationStrategy {
  return {
    relocateChildren: relocateChildrenToNewParent
  };
}