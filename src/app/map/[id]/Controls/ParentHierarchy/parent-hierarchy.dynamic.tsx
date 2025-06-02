"use client";

import { ChevronDown } from "lucide-react";
import type { HexTileData } from "../../State/types";
import { useMapCache } from "../../Cache/map-cache";
import { _getParentHierarchy, _shouldShowHierarchy } from "./hierarchy.utils";
import type { URLInfo } from "../../types/url-info";
import { StaticBaseTileLayout } from "../../Tile/Base/base.static";
import { getColorFromItem } from "../../Tile/Item/item.static";
import {
  HIERARCHY_TILE_BASE_HEXSIZE,
  HIERARCHY_TILE_SCALE,
} from "../../constants";

interface ParentHierarchyProps {
  centerCoordId: string;
  items: Record<string, HexTileData>;
  urlInfo: URLInfo;
}

interface DynamicHierarchyTileProps {
  item: HexTileData;
  _hierarchy: HexTileData[];
  _itemIndex: number;
  _urlInfo: URLInfo;
}

const DynamicHierarchyTile = ({
  item,
  _hierarchy,
  _itemIndex,
  _urlInfo,
}: DynamicHierarchyTileProps) => {
  const { navigateToItem } = useMapCache();

  const handleNavigation = async (e: React.MouseEvent) => {
    e.preventDefault();
    await navigateToItem(item.metadata.coordId);
  };

  return (
    <button
      onClick={handleNavigation}
      aria-label={`Navigate to ${item.data.name}`}
      className="group relative flex-shrink-0 cursor-pointer rounded-lg border-none bg-transparent transition-transform duration-200 hover:scale-105 focus:scale-105"
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
    </button>
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

export const ParentHierarchy = ({
  centerCoordId,
  items,
  urlInfo,
}: ParentHierarchyProps) => {
  const { state } = useMapCache();

  // Use currentCenter from cache state if available, otherwise fall back to prop
  const effectiveCenter = state.currentCenter ?? centerCoordId;

  const hierarchy = _getParentHierarchy(effectiveCenter, items);

  if (!_shouldShowHierarchy(hierarchy, effectiveCenter)) {
    return null;
  }

  return (
    <div className="fixed right-4 top-1/2 z-30 -translate-y-1/2">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-transparent px-3 py-4">
        {hierarchy.map((item, index) => (
          <div
            key={`hierarchy-${item.metadata.coordId}`}
            className="flex flex-col items-center gap-1"
          >
            <DynamicHierarchyTile
              item={item}
              _hierarchy={hierarchy}
              _itemIndex={index}
              _urlInfo={urlInfo}
            />
            {index < hierarchy.length - 1 && (
              <ChevronDown size={16} className="flex-shrink-0 text-zinc-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
