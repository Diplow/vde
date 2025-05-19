// REMOVE: "use client";

// REMOVE: import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import type { HexTileData } from "../State/types";
import {
  StaticBaseTileLayout,
  type TileColor,
  type TileScale,
  // REMOVE: TileCursor,
} from "./base.static";
import { StaticTileContent } from "./content.static";
import { Maximize2, Minimize2 } from "lucide-react";

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
  const isExpanded = allExpandedItemIds.includes(item.metadata.dbId);
  const href = getHref(
    item,
    pathname,
    currentSearchParamsString,
    allExpandedItemIds,
  );
  // REMOVE: const cursorStyle: TileCursor = isExpanded
  // REMOVE:   ? "cursor-zoom-out"
  // REMOVE:   : "cursor-zoom-in";
  const ariaLabelForButton = isExpanded
    ? `Collapse ${item.data.name}`
    : `Expand ${item.data.name}`;
  // REMOVE: const buttonText = isExpanded ? "Collapse" : "Expand";

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
  // Add more conditions here if TileScale can exceed 3 and you want further scaling
  // else if (scale > 3) { ... }

  return (
    <div className="group relative">
      {" "}
      {/* Added group for hover effect and relative for absolute positioning of the button */}
      <StaticBaseTileLayout
        coordId={item.metadata.coordId}
        scale={scale}
        color={getColorFromItem(item)}
        baseHexSize={baseHexSize}
        // REMOVE: cursor={cursorStyle} // Removed cursor, as the tile itself is not the primary link
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
      {shouldRenderButton && (
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
      )}
    </div>
  );
};

function getHref(
  item: HexTileData,
  pathname: string,
  currentSearchParamsString: string,
  allExpandedItemIds: string[],
) {
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
}
