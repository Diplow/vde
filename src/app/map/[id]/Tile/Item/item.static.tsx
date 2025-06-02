import type { HexTileData } from "../../State/types";
import {
  StaticBaseTileLayout,
  type TileColor,
  type TileScale,
} from "../Base/base.static";
import { StaticTileContent } from "./content.static";
import { TileButtons } from "./Buttons/item.buttons.progressive";
import type { URLInfo } from "../../types/url-info";

export interface StaticItemTileProps {
  item: HexTileData;
  scale?: TileScale;
  baseHexSize?: number;
  allExpandedItemIds: string[];
  hasChildren: boolean;
  isCenter?: boolean;
  urlInfo: URLInfo;
  interactive?: boolean;
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
  urlInfo,
  interactive = true,
}: StaticItemTileProps) => {
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
        isFocusable={false}
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
      {interactive && (
        <TileButtons
          item={item}
          urlInfo={urlInfo}
          displayConfig={{
            scale,
            isCenter,
          }}
          expansionState={{
            allExpandedItemIds,
            hasChildren,
          }}
        />
      )}
    </div>
  );
};
