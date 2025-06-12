import type { ReactNode } from "react";
import { StaticFrame } from "./frame";
import type { TileData } from "~/app/map/types/tile-data";
import type { TileScale } from "~/app/static/map/Tile/Base/base";
import type { URLInfo } from "~/app/map/types/url-info";

export interface CenterInfo {
  center: string;
  rootItemId: number;
  userId: number;
  groupId: number;
}

export interface StaticMapCanvasProps {
  centerInfo: CenterInfo;
  items: Record<string, TileData>;
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
        <StaticFrame
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
