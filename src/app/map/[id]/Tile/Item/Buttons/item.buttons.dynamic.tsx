"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, Crosshair } from "lucide-react";
import { useMapCache } from "../../../Cache/map-cache";
import {
  getButtonPositioning,
  getButtonsSizing,
  getExpandUrl,
  type TileButtonsProps,
} from "./item.buttons.static";

export const DynamicTileButtons = ({
  item,
  displayConfig,
  expansionState,
  urlInfo,
}: TileButtonsProps) => {
  const { scale = 1, isCenter = false } = displayConfig;
  const { allExpandedItemIds, hasChildren } = expansionState;
  const router = useRouter();
  const { navigateToItem, toggleItemExpansionWithURL } = useMapCache();

  const [isNavigating, setIsNavigating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const ariaLabelForExpandButton = isExpanded
    ? `Collapse ${item.data.name}`
    : `Expand ${item.data.name}`;

  const containerPositionClasses = getButtonPositioning(scale);
  const shouldRenderExpandButton = scale > 1;
  const shouldRenderNavigationButton = !isCenter;

  const { iconSize, buttonSizeClasses } = getButtonsSizing(scale);

  // Handle expansion/collapse with URL update and cache sync
  const handleExpansion = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsToggling(true);

    try {
      // Update map cache state and URL in one call
      toggleItemExpansionWithURL(item.metadata.dbId, {
        pathname: urlInfo.pathname,
        searchParamsString: urlInfo.searchParamsString,
      });
    } catch (error) {
      console.warn(
        "Dynamic expansion failed, falling back to page navigation",
        error,
      );
      // Fallback to traditional navigation
      const expandUrl = getExpandUrl(item, urlInfo, allExpandedItemIds);
      router.push(`${urlInfo.pathname}${expandUrl}`);
    } finally {
      setIsToggling(false);
    }
  };

  // Handle navigation with URL update and cache sync
  const handleNavigation = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);

    try {
      // Use dynamic navigation method for instant feedback
      await navigateToItem(item.metadata.coordId);
    } catch (error) {
      console.warn(
        "Dynamic navigation failed, falling back to page navigation",
        error,
      );
      // Fallback to router navigation
      const navigationUrl = `/map/${item.metadata.dbId}`;
      router.push(navigationUrl);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <div
      className={`${containerPositionClasses} pointer-events-none flex items-center gap-1`}
    >
      {/* Expand/Collapse Button */}
      {shouldRenderExpandButton && (
        <button
          onClick={handleExpansion}
          disabled={isToggling}
          aria-label={ariaLabelForExpandButton}
          aria-pressed={isExpanded}
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md text-white opacity-0 shadow-lg focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100 ${
            isToggling
              ? "animate-pulse bg-slate-600 hover:bg-slate-600"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {isExpanded ? (
            <Minimize2 size={iconSize} />
          ) : (
            <Maximize2 size={iconSize} />
          )}
        </button>
      )}

      {/* Navigation Button */}
      {shouldRenderNavigationButton && (
        <button
          onClick={handleNavigation}
          disabled={isNavigating}
          aria-label={`Navigate to ${item.data.name}`}
          className={`${buttonSizeClasses} pointer-events-auto flex items-center justify-center rounded-md text-white opacity-0 shadow-lg focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100 ${
            isNavigating
              ? "animate-pulse bg-blue-600 hover:bg-blue-600"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <Crosshair size={iconSize} />
        </button>
      )}
    </div>
  );
};
