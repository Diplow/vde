"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { HexTileData } from "../State/types";
import { StaticBaseTileLayout } from "./base.static";
import { startTransition } from "react";
import { getColorFromItem } from "./item.static";

interface HierarchyTileProps {
  item: HexTileData;
  isLast: boolean;
  hierarchy: HexTileData[];
  itemIndex: number;
}

const _createNavigationUrl = (
  item: HexTileData,
  currentSearchParams: URLSearchParams,
  hierarchy: HexTileData[],
  itemIndex: number,
): string => {
  const newParams = new URLSearchParams(currentSearchParams);

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

  // Create the new URL with expanded hierarchy items
  const baseUrl = `/map/${item.metadata.dbId}`;

  if (allExpandedIds.length > 0) {
    return `${baseUrl}?expandedItems=${allExpandedIds.join(",")}`;
  }

  return baseUrl;
};

export const HierarchyTile = ({
  item,
  hierarchy,
  itemIndex,
}: HierarchyTileProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scale = 1; // Fixed scale for hierarchy tiles
  const baseHexSize = 50; // Increased size for better visibility

  const handleNavigation = () => {
    const navigationUrl = _createNavigationUrl(
      item,
      searchParams,
      hierarchy,
      itemIndex,
    );

    router.push(navigationUrl);
  };

  return (
    <button
      onClick={handleNavigation}
      aria-label={`Navigate to ${item.data.name}`}
      className="group relative flex-shrink-0 cursor-pointer rounded-lg border-none bg-transparent transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
    >
      <div className="pointer-events-none">
        <StaticBaseTileLayout
          coordId={item.metadata.coordId}
          scale={scale}
          color={getColorFromItem(item)}
          baseHexSize={baseHexSize}
          isFocusable={false}
        >
          {/* Simplified content - only title, truncated */}
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
        </StaticBaseTileLayout>
      </div>
    </button>
  );
};
