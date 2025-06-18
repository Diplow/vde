import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import { getColor } from "~/app/map/types/tile-data";
import { CoordSystem, type Coord } from "~/lib/domains/mapping/utils/hex-coordinates";

/**
 * Migrates children from one parent position to another.
 * Preserves relative positions while updating absolute coordinates.
 */
export interface ChildrenMigrationStrategy {
  migrateChildren: (
    children: TileData[],
    newParentCoords: Coord,
    newParentCoordsId: string
  ) => TileData[];
}

/**
 * Calculates new coordinates for a child based on its new parent.
 * Preserves the child's relative position (last direction in path).
 */
function _calculateChildNewPosition(
  child: TileData,
  newParentCoords: Coord
): { coords: Coord; coordsId: string } | null {
  const childCoords = CoordSystem.parseId(child.metadata.coordId);
  
  // Get the last direction in the path (child's position relative to parent)
  const lastDir = childCoords.path[childCoords.path.length - 1];
  if (lastDir === undefined) {
    return null;
  }
  
  // Create new coordinates by appending direction to new parent
  const newCoords: Coord = {
    userId: newParentCoords.userId,
    groupId: newParentCoords.groupId,
    path: [...newParentCoords.path, lastDir],
  };
  
  return {
    coords: newCoords,
    coordsId: CoordSystem.createId(newCoords)
  };
}

/**
 * Migrates a single child to follow its parent's new position.
 * Updates coordinates, color, and parent reference.
 */
export function migrateChild(
  child: TileData,
  newParentCoords: Coord,
  newParentCoordsId: string
): TileData | null {
  const newPosition = _calculateChildNewPosition(child, newParentCoords);
  if (!newPosition) {
    return null;
  }
  
  return {
    ...child,
    metadata: {
      ...child.metadata,
      coordId: newPosition.coordsId,
      coordinates: newPosition.coords,
      parentId: newParentCoordsId,
    },
    data: {
      ...child.data,
      color: getColor(newPosition.coords),
    },
  };
}

/**
 * Migrates all children to follow their parent's new position.
 * Filters out any children that cannot be migrated.
 */
export function migrateChildrenBatch(
  children: TileData[],
  newParentCoords: Coord,
  newParentCoordsId: string
): TileData[] {
  return children
    .map(child => migrateChild(child, newParentCoords, newParentCoordsId))
    .filter((child): child is TileData => child !== null);
}

/**
 * Updates cache with migrated children.
 * Removes from old positions and adds to new positions.
 */
export function updateCacheWithMigratedChildren(
  cache: CacheState,
  oldChildren: TileData[],
  newChildren: TileData[]
): CacheState {
  const updatedItems = { ...cache.itemsById };
  
  // Remove old children
  oldChildren.forEach(child => {
    delete updatedItems[child.metadata.coordId];
  });
  
  // Add migrated children
  newChildren.forEach(child => {
    updatedItems[child.metadata.coordId] = child;
  });
  
  return {
    ...cache,
    itemsById: updatedItems,
  };
}

/**
 * Creates a children migration strategy.
 * Provides a consistent interface for migrating children during moves.
 */
export function createChildrenMigrationStrategy(): ChildrenMigrationStrategy {
  return {
    migrateChildren: migrateChildrenBatch
  };
}