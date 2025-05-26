"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Maximize2, Minimize2, Crosshair } from "lucide-react";
import type { HexTileData } from "../State/types";
import type { TileScale } from "./base.static";

interface TileButtonsProps {
  item: HexTileData;
  scale?: TileScale;
  allExpandedItemIds: string[];
  hasChildren: boolean;
  isCenter?: boolean;
}

const _getButtonPositioning = (scale: number) => {
  return "absolute left-1/2 -translate-x-1/2 top-[15%] z-30";
};

const _getExpandUrl = (
  item: HexTileData,
  currentSearchParams: URLSearchParams,
  allExpandedItemIds: string[],
): string => {
  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const newParams = new URLSearchParams(currentSearchParams);

  if (isExpanded) {
    // Remove from expanded items
    const filteredIds = allExpandedItemIds.filter(
      (id) => id !== item.metadata.dbId,
    );
    if (filteredIds.length > 0) {
      newParams.set("expandedItems", filteredIds.join(","));
    } else {
      newParams.delete("expandedItems");
    }
  } else {
    // Add to expanded items
    const newExpandedIds = [...allExpandedItemIds, item.metadata.dbId];
    newParams.set("expandedItems", newExpandedIds.join(","));
  }

  return `?${newParams.toString()}`;
};

const _createNavigationUrl = (
  item: HexTileData,
  currentSearchParams: URLSearchParams,
): string => {
  const newParams = new URLSearchParams(currentSearchParams);

  // Set the item as the new center focus
  newParams.set("focus", item.metadata.coordId);

  return `/map/${item.metadata.dbId}?${newParams.toString()}`;
};

export const TileButtons = ({
  item,
  scale = 1,
  allExpandedItemIds,
  hasChildren,
  isCenter = false,
}: TileButtonsProps) => {
  const searchParams = useSearchParams();

  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const ariaLabelForExpandButton = isExpanded
    ? `Collapse ${item.data.name}`
    : `Expand ${item.data.name}`;

  const containerPositionClasses = _getButtonPositioning(scale);
  const shouldRenderExpandButton = hasChildren || isExpanded;
  const shouldRenderNavigationButton = !isCenter; // Hide navigation button for center tile

  // Generate URLs
  const expandUrl = _getExpandUrl(item, searchParams, allExpandedItemIds);
  const navigationUrl = _createNavigationUrl(item, searchParams);

  // Dynamic button and icon sizes based on scale
  let buttonSizeClasses = "h-6 w-6";
  let iconSize = 12;

  if (scale >= 2) {
    buttonSizeClasses = "h-8 w-8";
    iconSize = 16;
  }

  if (scale === 3) {
    buttonSizeClasses = "h-12 w-12";
    iconSize = 24;
  }

  if (scale >= 4) {
    buttonSizeClasses = "h-20 w-20";
    iconSize = 40;
  }

  return (
    <div
      className={`${containerPositionClasses} pointer-events-none flex items-center gap-1`}
    >
      {/* Expand/Collapse Button */}
      {shouldRenderExpandButton && (
        <Link
          href={expandUrl}
          aria-label={ariaLabelForExpandButton}
          aria-pressed={isExpanded}
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md bg-slate-800 text-white opacity-0 shadow-lg transition-opacity duration-300 hover:bg-slate-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`}
          style={{
            viewTransitionName: `expand-button-${item.metadata.coordId}`,
          }}
        >
          {isExpanded ? (
            <Minimize2 size={iconSize} />
          ) : (
            <Maximize2 size={iconSize} />
          )}
        </Link>
      )}

      {/* Navigation Button */}
      {shouldRenderNavigationButton && (
        <Link
          href={navigationUrl}
          aria-label={`Navigate to ${item.data.name}`}
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md bg-slate-800 text-white opacity-0 shadow-lg transition-opacity duration-300 hover:bg-slate-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`}
          data-navigation-direction="zoom-in"
          style={{ viewTransitionName: `nav-button-${item.metadata.coordId}` }}
        >
          <Crosshair size={iconSize} />
        </Link>
      )}
    </div>
  );
};
