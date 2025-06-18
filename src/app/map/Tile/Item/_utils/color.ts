import type { TileData } from "~/app/map/types/tile-data";
import type { TileColor } from "~/app/static/map/Tile/Base/base";

/**
 * Extracts color configuration from a tile's data
 * Parses the color string format "colorName-tint" into a TileColor object
 * 
 * @param item - The tile data containing color information
 * @returns TileColor object with color and tint properties
 */
export function getColorFromItem(item: TileData): TileColor {
  const [colorName, tint] = item.data.color.split("-");
  return {
    color: colorName as TileColor["color"],
    tint: tint as TileColor["tint"],
  };
}