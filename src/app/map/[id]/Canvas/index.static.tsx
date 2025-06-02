import type { ReactNode } from "react";
import { StaticHexRegion } from "./hex-region.static";
import type { HexTileData } from "../State/types";
import type { TileScale } from "../Tile/Base/base.static";
import type { URLInfo } from "../types/url-info";

export interface CenterInfo {
  center: string;
  rootItemId: number;
  userId: number;
  groupId: number;
}

export interface StaticMapCanvasProps {
  centerInfo: CenterInfo;
  items: Record<string, HexTileData>;
  scale?: number;
  expandedItemIds?: string[];
  baseHexSize?: number;
  urlInfo: URLInfo;
  children?: ReactNode;
  currentUserId?: number;
}

export const StaticMapCanvas = ({
  centerInfo,
  items,
  scale = 3,
  expandedItemIds = [],
  baseHexSize = 50,
  urlInfo,
  children,
  currentUserId,
}: StaticMapCanvasProps) => {
  return (
    <div className="relative flex h-full w-full flex-col">
      <div
        data-canvas-id={centerInfo.center}
        className="pointer-events-auto grid flex-grow place-items-center overflow-auto p-4"
      >
        <StaticHexRegion
          center={centerInfo.center}
          mapItems={items}
          baseHexSize={baseHexSize}
          expandedItemIds={expandedItemIds}
          scale={scale as TileScale}
          urlInfo={urlInfo}
          currentUserId={currentUserId}
        />

        {children}
      </div>
    </div>
  );
};
