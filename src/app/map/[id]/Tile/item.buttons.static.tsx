import Link from "next/link";
import type { HexTileData } from "../State/types";
import { Maximize2, Minimize2 } from "lucide-react";
import type { TileScale } from "./base.static";

interface TileButtonsProps {
  item: HexTileData;
  scale?: TileScale;
  pathname: string;
  currentSearchParamsString: string;
  allExpandedItemIds: string[];
  hasChildren: boolean;
}

const getHref = (
  item: HexTileData,
  pathname: string,
  currentSearchParamsString: string,
  allExpandedItemIds: string[],
) => {
  const itemId = item.metadata.dbId;
  const isExpanded = allExpandedItemIds.includes(itemId);

  const newParams = new URLSearchParams(currentSearchParamsString);
  const newExpandedItemsList = isExpanded
    ? allExpandedItemIds.filter((id) => id !== itemId)
    : [...allExpandedItemIds, itemId];

  if (newExpandedItemsList.length > 0) {
    newParams.set("expandedItems", newExpandedItemsList.join(","));
  } else {
    newParams.delete("expandedItems");
  }
  newParams.set("focus", itemId);
  const href = `${pathname}?${newParams.toString()}`;
  return href;
};

export const TileButtons = ({
  item,
  scale = 1,
  pathname,
  currentSearchParamsString,
  allExpandedItemIds,
  hasChildren,
}: TileButtonsProps) => {
  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const href = getHref(
    item,
    pathname,
    currentSearchParamsString,
    allExpandedItemIds,
  );
  const ariaLabelForButton = isExpanded
    ? `Collapse ${item.data.name}`
    : `Expand ${item.data.name}`;

  const buttonPositionClasses =
    scale >= 2
      ? "absolute top-[15%] left-1/2 -translate-x-1/2 z-20"
      : "absolute inset-0 z-20 m-auto";

  const shouldRenderButton = hasChildren || isExpanded;

  // Dynamic button and icon sizes based on scale
  let buttonSizeClasses = "h-7 w-7";
  let iconSize = 15;

  if (scale === 3) {
    buttonSizeClasses = "h-14 w-14";
    iconSize = 30;
  }

  if (scale === 4) {
    buttonSizeClasses = "h-28 w-28";
    iconSize = 60;
  }

  if (!shouldRenderButton) {
    return null;
  }

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={ariaLabelForButton}
      role="button"
      aria-pressed={isExpanded}
      className={`${buttonPositionClasses} ${buttonSizeClasses} flex items-center justify-center rounded-md bg-slate-800 text-white opacity-0 shadow-lg transition-opacity duration-300 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-500 group-hover:opacity-100`}
      style={{ textDecoration: "none" }}
    >
      {isExpanded ? (
        <Minimize2 size={iconSize} />
      ) : (
        <Maximize2 size={iconSize} />
      )}
    </Link>
  );
};
