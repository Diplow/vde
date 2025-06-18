import type { Coord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { SwapPreviewState } from "./types";
import { DEFAULT_MAP_COLORS } from "../../constants";

/**
 * Calculates the color a tile would have at a given coordinate
 */
function calculateColorForCoordinate(coord: Coord): string {
  if (coord.path.length === 0) {
    return "zinc-50";
  }
  
  const colorBase = DEFAULT_MAP_COLORS[coord.path[0]!];
  const colorIntensity = 100 + 100 * coord.path.length;
  
  return `${colorBase}-${colorIntensity}`;
}

/**
 * Creates a preview state for swap operation showing what colors
 * the tiles would have after swapping positions
 */
export function createSwapColorPreview(
  sourceCoord: Coord,
  targetCoord: Coord
): SwapPreviewState {
  return {
    type: "swap",
    sourceCoord,
    targetCoord,
    data: {
      // Source tile would get target's color
      sourcePreviewColor: calculateColorForCoordinate(targetCoord),
      // Target tile would get source's color  
      targetPreviewColor: calculateColorForCoordinate(sourceCoord),
    },
  };
}

/**
 * Gets the preview color for a tile during a swap operation
 */
export function getSwapPreviewColor(
  tileCoord: Coord,
  swapPreview: SwapPreviewState
): string | null {
  const isSource = 
    tileCoord.userId === swapPreview.sourceCoord.userId &&
    tileCoord.groupId === swapPreview.sourceCoord.groupId &&
    tileCoord.path.join("") === swapPreview.sourceCoord.path.join("");
    
  const isTarget = 
    tileCoord.userId === swapPreview.targetCoord.userId &&
    tileCoord.groupId === swapPreview.targetCoord.groupId &&
    tileCoord.path.join("") === swapPreview.targetCoord.path.join("");
  
  if (isSource) {
    return swapPreview.data.sourcePreviewColor;
  }
  
  if (isTarget) {
    return swapPreview.data.targetPreviewColor;
  }
  
  return null;
}