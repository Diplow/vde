import Link from "next/link";
import { Maximize2, Minimize2, Crosshair } from "lucide-react";
import type { TileData } from "~/app/map/types/tile-data";
import type { TileScale } from "~/app/static/map/Tile/Base/base";
import type { URLInfo } from "~/app/map/types/url-info";
import { testLogger } from "~/lib/test-logger";

export interface TileButtonsProps {
  item: TileData;
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

// Shared UI components for consistency between static and dynamic versions

export interface TileButtonUIProps {
  iconSize: number;
  buttonSizeClasses: string;
  children: React.ReactNode;
  ariaLabel: string;
  ariaPressed?: boolean;
  disabled?: boolean;
  className?: string;
}

export const TileButtonUI = ({
  iconSize: _iconSize,
  buttonSizeClasses,
  children,
  ariaLabel,
  ariaPressed,
  disabled = false,
  className = "",
}: TileButtonUIProps) => {
  const baseClasses = `${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md text-white opacity-0 shadow-lg focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`;
  const stateClasses = disabled
    ? "animate-pulse bg-slate-600 hover:bg-slate-600"
    : "bg-slate-800 hover:bg-slate-700";

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${className}`}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      {children}
    </div>
  );
};

// Shared helper functions

export const getButtonPositioning = (_scale: number) => {
  // Default positioning for scale 1 and 4+
  return "absolute left-1/2 -translate-x-1/2 top-[10%] z-30";
};

export const getButtonsSizing = (scale: number) => {
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

export const getExpandUrl = (
  item: TileData,
  urlInfo: URLInfo,
  allExpandedItemIds: string[],
): string => {
  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const newParams = new URLSearchParams(urlInfo.searchParamsString);

  if (isExpanded) {
    _collapse(newParams, item, allExpandedItemIds);
  } else {
    _expand(newParams, item, allExpandedItemIds);
  }

  // Add action metadata for server-side logging
  newParams.set("_action", isExpanded ? "collapse" : "expand");
  newParams.set("_itemId", item.metadata.dbId);
  newParams.set("_itemName", item.data.name);

  const url = `?${newParams.toString()}`;

  testLogger.debug(
    `Generated ${isExpanded ? "collapse" : "expand"} URL for ${item.metadata.dbId}`,
    {
      itemId: item.metadata.dbId,
      coordinates: item.metadata.coordId,
      wasExpanded: isExpanded,
      url,
    },
  );

  return url;
};

export const createNavigationUrl = (
  item: TileData,
  _urlInfo: URLInfo,
): string => {
  // Navigate to map with center as query param and action metadata
  const params = new URLSearchParams({
    center: item.metadata.dbId,
    _action: "navigate",
    _itemId: item.metadata.dbId,
    _itemName: item.data.name,
  });
  return `/static/map?${params.toString()}`;
};

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

  const containerPositionClasses = getButtonPositioning(scale);
  const shouldRenderExpandButton = (hasChildren || isExpanded) && scale > 1;
  const shouldRenderNavigationButton = !isCenter;

  // Generate URLs
  const expandUrl = getExpandUrl(item, urlInfo, allExpandedItemIds);
  const navigationUrl = createNavigationUrl(item, urlInfo);

  const { iconSize, buttonSizeClasses } = getButtonsSizing(scale);

  // Generate tile ID for unique test IDs
  const tileId = `${item.metadata.coordinates.userId}-${item.metadata.coordinates.groupId}-${item.metadata.coordinates.path.join("-")}`;

  // Log button rendering
  testLogger.component("StaticTileButtons", {
    tileId,
    itemName: item.data.name,
    dbId: item.metadata.dbId,
    shouldRenderExpandButton,
    shouldRenderNavigationButton,
    isExpanded,
    hasChildren,
    expandUrl,
    navigationUrl,
  });

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
          data-testid={
            isExpanded ? `collapse-button-${tileId}` : `expand-button-${tileId}`
          }
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md bg-slate-800 text-white opacity-0 shadow-lg hover:bg-slate-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`}
          // onClick={() => {
          //   testLogger.interaction('static-expand-click', tileId, {
          //     itemName: item.data.name,
          //     wasExpanded: isExpanded,
          //     expandUrl
          //   });
          // }}
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
          data-testid={`navigate-button-${tileId}`}
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md bg-slate-800 text-white opacity-0 shadow-lg hover:bg-slate-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`}
          // onClick={() => {
          //   testLogger.interaction("static-navigate-click", tileId, {
          //     itemName: item.data.name,
          //     navigationUrl,
          //   });
          // }}
        >
          <Crosshair size={iconSize} />
        </Link>
      )}
    </div>
  );
};

// Private helper functions

const _collapse = (
  newParams: URLSearchParams,
  item: TileData,
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
  item: TileData,
  allExpandedItemIds: string[],
) => {
  const newExpandedIds = [...allExpandedItemIds, item.metadata.dbId];
  newParams.set("expandedItems", newExpandedIds.join(","));
};
