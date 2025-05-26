import Link from "next/link";
import type { HexTileData } from "../../State/types";
import { StaticBaseTileLayout } from "../Base/base.static";
import { getColorFromItem } from "./item.static";
import type { URLInfo } from "../../types/url-info";
import {
  HIERARCHY_TILE_BASE_HEXSIZE,
  HIERARCHY_TILE_SCALE,
} from "../../constants";

interface HierarchyTileProps {
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
  const newParams = new URLSearchParams(urlInfo.searchParamsString);

  // Get all hierarchy items up to and including the clicked item
  const hierarchyUpToItem = hierarchy.slice(0, itemIndex + 1);

  // Extract their database IDs for the expandedItems
  const hierarchyIds = hierarchyUpToItem.map(
    (hierarchyItem) => hierarchyItem.metadata.dbId,
  );

  // Get any existing expanded items that are not part of the hierarchy
  const existingExpandedItems = newParams.get("expandedItems");
  const existingIds = existingExpandedItems
    ? existingExpandedItems.split(",")
    : [];

  // Combine hierarchy IDs with existing expanded items (remove duplicates)
  const allExpandedIds = [...new Set([...hierarchyIds, ...existingIds])];

  // Set the focus to this item
  newParams.set("focus", item.metadata.coordId);

  // Create the new URL with expanded hierarchy items
  const baseUrl = `/map/${item.metadata.dbId}`;

  if (allExpandedIds.length > 0) {
    newParams.set("expandedItems", allExpandedIds.join(","));
  }

  return `${baseUrl}?${newParams.toString()}`;
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
