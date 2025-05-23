// REMOVE: "use client";

// REMOVE: import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import type { HexTileData } from "../State/types";
import { StaticBaseTileLayout, type TileScale } from "./base.static";
import { getColorFromItem } from "./item.static";

interface StaticMiniMapItemTileProps {
  item: HexTileData;
  scale?: TileScale;
  baseHexSize?: number;
  pathname: string;
  currentSearchParamsString: string;
}

export const StaticMiniMapItemTile = ({
  item,
  scale = 1,
  baseHexSize = 40,
  pathname,
  currentSearchParamsString,
}: StaticMiniMapItemTileProps) => {
  const href = getHref(item, pathname, currentSearchParamsString);
  const ariaLabel = `Scroll to ${item.data.name}`;

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={ariaLabel}
      className="block focus:outline-none"
      style={{ textDecoration: "none" }}
      role="button"
    >
      <StaticBaseTileLayout
        coordId={item.metadata.coordId}
        scale={scale}
        color={getColorFromItem(item)}
        baseHexSize={baseHexSize}
        cursor={"cursor-crosshair"}
        stroke={{ color: "zinc-950", width: 1 }}
        isFocusable={false}
      />
    </Link>
  );
};

function getHref(
  item: HexTileData,
  pathname: string,
  currentSearchParamsString: string,
) {
  const itemId = item.metadata.dbId;
  const newParams = new URLSearchParams(currentSearchParamsString);
  newParams.set("focus", itemId);
  return `${pathname}?${newParams.toString()}`;
}
