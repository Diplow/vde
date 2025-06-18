import type { TileData } from "~/app/map/types/tile-data";
import type { TileColor } from "~/app/static/map/Tile/Base/base";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { getColor as calculateColor } from "~/app/map/types/tile-data";
import { getColorFromItem } from "../_utils/color";

/**
 * Calculates the preview color for a tile during a swap operation
 * Shows what color the tile would have after the swap completes
 * 
 * @param item - The tile data
 * @param isDropTargetActive - Whether this tile is currently a drop target
 * @param dropOperation - The type of drop operation (swap/move/null)
 * @returns The color to display for the tile
 */
export function getSwapPreviewColor(
  item: TileData,
  isDropTargetActive: boolean,
  dropOperation: 'move' | 'swap' | null
): TileColor {
  // If not an active swap target, use normal color
  if (!isDropTargetActive || dropOperation !== 'swap') {
    return getColorFromItem(item);
  }

  try {
    // For swap operations, show preview of the color it would have after swap
    // The dragged tile would take this position's coordinates
    const targetCoords = CoordSystem.parseId(item.metadata.coordId);
    const previewColorString = calculateColor(targetCoords);
    
    // Validate color string format
    if (!previewColorString || typeof previewColorString !== 'string') {
      console.warn(`Invalid preview color: expected string, got ${typeof previewColorString}`);
      return getColorFromItem(item); // Fallback to current color
    }
    
    const parts = previewColorString.split("-");
    
    // Check if color string has correct format (colorName-tint)
    if (parts.length !== 2) {
      console.warn(`Invalid preview color format: "${previewColorString}". Expected "color-tint" format.`);
      return getColorFromItem(item); // Fallback to current color
    }
    
    const [colorName, tint] = parts;
    
    // Validate parts exist
    if (!colorName || !tint) {
      console.warn(`Invalid preview color parts: colorName="${colorName}", tint="${tint}"`);
      return getColorFromItem(item); // Fallback to current color
    }
    
    return {
      color: colorName as TileColor["color"],
      tint: tint as TileColor["tint"]
    };
  } catch (error) {
    console.error(`Error calculating swap preview color:`, error);
    return getColorFromItem(item); // Fallback to current color on any error
  }
}