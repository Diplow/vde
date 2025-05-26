import type { HexTileData } from "../State/types";
import {
  StaticBaseTileLayout,
  type TileColor,
  type TileScale,
} from "./base.static";
import { StaticTileContent } from "./content.static";
import { TileButtons } from "./item.buttons.static";

interface StaticItemTileProps {
  item: HexTileData;
  scale?: TileScale;
  baseHexSize?: number;
  allExpandedItemIds: string[];
  hasChildren: boolean;
  isCenter?: boolean;
}

export const getColorFromItem = (item: HexTileData): TileColor => {
  const [colorName, tint] = item.data.color.split("-");
  return {
    color: colorName as TileColor["color"],
    tint: tint as TileColor["tint"],
  };
};

export const StaticItemTile = ({
  item,
  scale = 1,
  baseHexSize = 50,
  allExpandedItemIds,
  hasChildren,
  isCenter = false,
}: StaticItemTileProps) => {
  const tilePosition = isCenter ? "center" : "child";

  // Create view transition name based on coordinate path
  const pathString =
    item.metadata.coordinates.path.length > 0
      ? item.metadata.coordinates.path.join("-")
      : "center";
  const viewTransitionName = `item-tile-${pathString}`;

  return (
    <div className="group relative hover:z-10">
      {/* Invisible hover area overlay to ensure full tile responds to hover */}
      <div className="pointer-events-auto absolute inset-0 z-10" />

      {/* Hexagon tile with full hover area */}
      <StaticBaseTileLayout
        coordId={item.metadata.coordId}
        scale={scale}
        color={getColorFromItem(item)}
        baseHexSize={baseHexSize}
        isFocusable={false} // Kept as false, focus will be on the button
        viewTransitionName={viewTransitionName}
        dataTileScale={scale.toString()}
        dataTilePosition={tilePosition}
        dataTilePath={pathString}
      >
        <StaticTileContent
          data={{
            title: item.data.name,
            description: item.data.description,
            url: item.data.url,
          }}
          scale={scale}
        />
      </StaticBaseTileLayout>
      <TileButtons
        item={item}
        scale={scale}
        allExpandedItemIds={allExpandedItemIds}
        hasChildren={hasChildren}
        isCenter={isCenter}
      />
    </div>
  );
};
