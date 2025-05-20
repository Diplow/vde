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
  pathname: string;
  currentSearchParamsString: string;
  allExpandedItemIds: string[];
  hasChildren: boolean;
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
  pathname,
  currentSearchParamsString,
  allExpandedItemIds,
  hasChildren,
}: StaticItemTileProps) => {
  return (
    <div className="group relative">
      {" "}
      {/* Added group for hover effect and relative for absolute positioning of the button */}
      <StaticBaseTileLayout
        coordId={item.metadata.coordId}
        scale={scale}
        color={getColorFromItem(item)}
        baseHexSize={baseHexSize}
        isFocusable={false} // Kept as false, focus will be on the button
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
        pathname={pathname}
        currentSearchParamsString={currentSearchParamsString}
        allExpandedItemIds={allExpandedItemIds}
        hasChildren={hasChildren}
      />
    </div>
  );
};
