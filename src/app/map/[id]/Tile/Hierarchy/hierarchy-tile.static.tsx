import Link from "next/link";
import type { HexTileData } from "../../State/types";
import { StaticBaseTileLayout } from "../Base/base.static";
import { getColorFromItem } from "../Item/item.static";
import type { URLInfo } from "../../types/url-info";
import {
  HIERARCHY_TILE_BASE_HEXSIZE,
  HIERARCHY_TILE_SCALE,
} from "../../constants";

export interface HierarchyTileProps {
  item: HexTileData;
  hierarchy: HexTileData[];
  itemIndex: number;
  urlInfo: URLInfo;
}

const _createNavigationUrl = (
  item: HexTileData,
  urlInfo: URLInfo,
  hierarchy: HexTileData[],
  itemIndex: number,
): string => {
  // Navigate directly to the item's page
  return `/map/${item.metadata.dbId}`;
};

export const HierarchyTile = ({
  item,
  hierarchy,
  itemIndex,
  urlInfo,
}: HierarchyTileProps) => {
  const navigationUrl = _createNavigationUrl(
    item,
    urlInfo,
    hierarchy,
    itemIndex,
  );

  return (
    <Link
      href={navigationUrl}
      aria-label={`Navigate to ${item.data.name}`}
      className="group relative flex-shrink-0 cursor-pointer rounded-lg border-none bg-transparent hover:scale-105 focus:scale-105"
    >
      <div className="pointer-events-none">
        <StaticBaseTileLayout
          coordId={item.metadata.coordId}
          scale={HIERARCHY_TILE_SCALE}
          color={getColorFromItem(item)}
          baseHexSize={HIERARCHY_TILE_BASE_HEXSIZE}
          isFocusable={false}
        >
          <HierarchyTileContent item={item} />
        </StaticBaseTileLayout>
      </div>
    </Link>
  );
};

const HierarchyTileContent = ({ item }: { item: HexTileData }) => {
  return (
    <div className="flex h-full w-full items-center justify-center p-2">
      <span
        className="text-center text-xs font-medium leading-tight text-slate-800"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
        title={item.data.name}
      >
        {item.data.name}
      </span>
    </div>
  );
};
