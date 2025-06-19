import type { TileData } from "~/app/map/types/tile-data";
import {
  StaticBaseTileLayout,
  type TileColor,
  type TileScale,
} from "~/app/static/map/Tile/Base/base";
import { StaticTileContent } from "~/app/static/map/Tile/Item/content";
import { TileButtons } from "./item.buttons";
import type { URLInfo } from "~/app/map/types/url-info";
import { testLogger } from "~/lib/test-logger";

export interface StaticItemTileProps {
  item: TileData;
  scale?: TileScale;
  baseHexSize?: number;
  allExpandedItemIds: string[];
  hasChildren: boolean;
  isCenter?: boolean;
  urlInfo: URLInfo;
  interactive?: boolean;
}

export const getColorFromItem = (item: TileData): TileColor => {
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
  // Generate test ID from coordinates
  const testId = `tile-${item.metadata.coordinates.userId}-${item.metadata.coordinates.groupId}-${item.metadata.coordinates.path.join("-")}`;

  console.log({ scale, testId })
  // Log tile rendering for E2E tests
  testLogger.component("StaticItemTile", {
    testId,
    name: item.data.name,
    dbId: item.metadata.dbId,
    coordinates: item.metadata.coordId,
    isExpanded: allExpandedItemIds.includes(item.metadata.dbId),
    hasChildren,
    isCenter,
    scale,
  });

  return (
    <div className="group relative hover:z-10" data-testid={testId}>
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
          tileId={`${item.metadata.coordinates.userId}-${item.metadata.coordinates.groupId}-${item.metadata.coordinates.path.join("-")}`}
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
