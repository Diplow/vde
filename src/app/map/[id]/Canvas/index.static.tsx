import type { ReactNode } from "react";
import { StaticHexRegion } from "./hex-region.static";
import type { HexTileData } from "../State/types";
import { MiniMapController, ScaleController } from "../Controls";
import type { TileScale } from "../Tile/base.static";

export interface StaticMapCanvasProps {
  center: string;
  items: Record<string, HexTileData>;
  scale?: number;
  expandedItemIds?: string[];
  baseHexSize?: number;
  children?: ReactNode;
  pathname: string;
  currentSearchParamsString: string;
}

export const StaticMapCanvas = ({
  center,
  items,
  scale = 3,
  expandedItemIds = [],
  baseHexSize = 50,
  children,
  pathname,
  currentSearchParamsString,
}: StaticMapCanvasProps) => {
  return (
    <div className="relative flex h-full w-full flex-col">
      <div
        data-canvas-id={center}
        className="pointer-events-auto grid flex-grow place-items-center overflow-auto p-4"
      >
        <StaticHexRegion
          center={center}
          mapItems={items}
          baseHexSize={baseHexSize}
          expandedItemIds={expandedItemIds}
          scale={scale as TileScale}
          pathname={pathname}
          currentSearchParamsString={currentSearchParamsString}
        />

        {/* Optional children to render additional controls */}
        <ScaleController scale={scale} />
        <MiniMapController
          minimapItemsData={items}
          expandedItemIds={expandedItemIds}
          currentMapCenterCoordId={center}
        />
        {children}
      </div>
    </div>
  );
};
