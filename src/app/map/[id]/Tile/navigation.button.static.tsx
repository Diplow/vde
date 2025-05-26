import Link from "next/link";
import type { HexTileData } from "../State/types";
import { Crosshair } from "lucide-react";
import type { TileScale } from "./base.static";

interface NavigationButtonProps {
  item: HexTileData;
  pathname: string;
  currentSearchParamsString: string;
  scale?: TileScale;
}

const _createNavigationHref = (
  item: HexTileData,
  pathname: string,
  currentSearchParamsString: string,
): string => {
  const newParams = new URLSearchParams(currentSearchParamsString);

  // Set the item as the new center
  newParams.set("focus", item.metadata.coordId);

  // Clear expanded items to reset expansion state when navigating
  newParams.delete("expandedItems");

  return `${pathname}?${newParams.toString()}`;
};

export const NavigationButton = ({
  item,
  pathname,
  currentSearchParamsString,
  scale = 1,
}: NavigationButtonProps) => {
  const href = _createNavigationHref(item, pathname, currentSearchParamsString);
  const ariaLabel = `Navigate to ${item.data.name}`;

  // Dynamic button and icon sizes based on scale
  let buttonSizeClasses = "h-6 w-6";
  let iconSize = 12;

  if (scale >= 2) {
    buttonSizeClasses = "h-7 w-7";
    iconSize = 15;
  }

  if (scale === 3) {
    buttonSizeClasses = "h-12 w-12";
    iconSize = 24;
  }

  if (scale === 4) {
    buttonSizeClasses = "h-24 w-24";
    iconSize = 48;
  }

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={ariaLabel}
      role="button"
      className={`${buttonSizeClasses} flex items-center justify-center rounded-md bg-blue-600 text-white opacity-0 shadow-lg transition-opacity duration-300 hover:bg-blue-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400 group-hover:opacity-100`}
      style={{ textDecoration: "none" }}
    >
      <Crosshair size={iconSize} />
    </Link>
  );
};
