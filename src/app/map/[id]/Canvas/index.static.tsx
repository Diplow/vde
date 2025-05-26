import type { ReactNode } from "react";
import { StaticHexRegion } from "./hex-region.static";
import type { HexTileData } from "../State/types";
import { MiniMapController, ScaleController } from "../Controls";
import type { TileScale } from "../Tile/Base/base.static";
import { ParentHierarchy } from "../Controls/parent-hierarchy.static";
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
}

export const StaticMapCanvas = ({
  centerInfo,
  items,
  scale = 3,
  expandedItemIds = [],
  baseHexSize = 50,
  urlInfo,
  children,
}: StaticMapCanvasProps) => {
  return (
    <div className="relative flex h-full w-full flex-col">
      <div
        data-canvas-id={centerInfo.center}
        className="pointer-events-auto grid flex-grow place-items-center overflow-auto p-4"
      >
        <ParentHierarchy
          centerCoordId={centerInfo.center}
          items={items}
          urlInfo={urlInfo}
        />

        <StaticHexRegion
          center={centerInfo.center}
          mapItems={items}
          baseHexSize={baseHexSize}
          expandedItemIds={expandedItemIds}
          scale={scale as TileScale}
          urlInfo={urlInfo}
        />

        <ScaleController scale={scale} />
        <MiniMapController
          minimapItemsData={items}
          expandedItemIds={expandedItemIds}
          currentMapCenterCoordId={centerInfo.center}
          urlInfo={urlInfo}
        />
        {children}
      </div>
    </div>
  );
};
