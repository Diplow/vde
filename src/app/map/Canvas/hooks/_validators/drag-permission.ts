import type { TileData } from "~/app/map/types/tile-data";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

export function canDragTile(
  tile: TileData | null | undefined,
  currentUserId: number | null
): boolean {
  if (!currentUserId || !tile) {
    return false;
  }
  
  // Check ownership (convert to string for comparison)
  if (tile.metadata.ownerId !== String(currentUserId)) {
    return false;
  }
  
  // Check if it's not a root tile (UserTile)
  const coords = CoordSystem.parseId(tile.metadata.coordId);
  if (coords.path.length === 0) {
    return false;
  }
  
  return true;
}