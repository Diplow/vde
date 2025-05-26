import Link from "next/link";
import { Maximize2, Minimize2, Crosshair } from "lucide-react";
import type { HexTileData } from "../../State/types";
import type { TileScale } from "../Base/base.static";
import type { URLInfo } from "../../types/url-info";

interface TileButtonsProps {
  item: HexTileData;
  displayConfig: {
    scale?: TileScale;
    isCenter?: boolean;
  };
  expansionState: {
    allExpandedItemIds: string[];
    hasChildren: boolean;
  };
  urlInfo: URLInfo;
}

export const TileButtons = ({
  item,
  displayConfig,
  expansionState,
  urlInfo,
}: TileButtonsProps) => {
  const { scale = 1, isCenter = false } = displayConfig;
  const { allExpandedItemIds, hasChildren } = expansionState;

  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const ariaLabelForExpandButton = isExpanded
    ? `Collapse ${item.data.name}`
    : `Expand ${item.data.name}`;

  const containerPositionClasses = _getButtonPositioning(scale);
  const shouldRenderExpandButton = (hasChildren || isExpanded) && scale > 1;
  const shouldRenderNavigationButton = !isCenter;

  // Generate URLs
  const expandUrl = _getExpandUrl(item, urlInfo, allExpandedItemIds);
  const navigationUrl = _createNavigationUrl(item, urlInfo);

  const { iconSize, buttonSizeClasses } = _getButtonsSizing(scale);

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
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md bg-slate-800 text-white opacity-0 shadow-lg hover:bg-slate-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`}
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
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md bg-slate-800 text-white opacity-0 shadow-lg hover:bg-slate-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`}
        >
          <Crosshair size={iconSize} />
        </Link>
      )}
    </div>
  );
};

// Private helper functions

const _getButtonPositioning = (scale: number) => {
  return "absolute left-1/2 -translate-x-1/2 top-[15%] z-30";
};

const _getExpandUrl = (
  item: HexTileData,
  urlInfo: URLInfo,
  allExpandedItemIds: string[],
): string => {
  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const newParams = new URLSearchParams(urlInfo.searchParamsString);

  isExpanded
    ? _collapse(newParams, item, allExpandedItemIds)
    : _expand(newParams, item, allExpandedItemIds);

  return `?${newParams.toString()}`;
};

const _createNavigationUrl = (item: HexTileData, urlInfo: URLInfo): string => {
  const newParams = new URLSearchParams(urlInfo.searchParamsString);

  // Set the item as the new center focus
  newParams.set("focus", item.metadata.coordId);

  return `/map/${item.metadata.dbId}?${newParams.toString()}`;
};

const _getButtonsSizing = (scale: number) => {
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

  return { iconSize, buttonSizeClasses };
};

const _collapse = (
  newParams: URLSearchParams,
  item: HexTileData,
  allExpandedItemIds: string[],
) => {
  const filteredIds = allExpandedItemIds.filter(
    (id) => id !== item.metadata.dbId,
  );
  if (filteredIds.length > 0) {
    newParams.set("expandedItems", filteredIds.join(","));
  } else {
    newParams.delete("expandedItems");
  }
};

const _expand = (
  newParams: URLSearchParams,
  item: HexTileData,
  allExpandedItemIds: string[],
) => {
  const newExpandedIds = [...allExpandedItemIds, item.metadata.dbId];
  newParams.set("expandedItems", newExpandedIds.join(","));
};
