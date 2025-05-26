import { StaticBaseTileLayout, type TileScale } from "../Tile/Base/base.static";
import type { HexTileData } from "../State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { StaticMiniMapItemTile } from "../Tile/Item/item-minimap.static";
import { useState, useRef, useEffect, useCallback } from "react";
import type { URLInfo } from "../types/url-info";

interface ViewportData {
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

export interface StaticMiniMapProps {
  center: string;
  mapItems: Record<string, HexTileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale?: TileScale;
  urlInfo: URLInfo;
  viewportData?: ViewportData | null;
  mainMapGlobalScale?: TileScale;
  onViewportDragTo?: (newScrollLeft: number, newScrollTop: number) => void;
  isDraggable?: boolean;
}

export const StaticMiniMap = ({
  center,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale = 2,
  urlInfo,
  viewportData,
  mainMapGlobalScale = 1,
  onViewportDragTo,
  isDraggable = true,
}: StaticMiniMapProps) => {
  const centerItem = mapItems[center];
  const isExpanded = centerItem
    ? expandedItemIds.includes(centerItem.metadata.dbId)
    : false;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartDataRef = useRef<{
    initialMouseX: number;
    initialMouseY: number;
    initialRX: number;
    initialRY: number;
  } | null>(null);

  let rX = 0,
    rY = 0;

  let viewportRectToRender = null;
  if (viewportData) {
    const minimapOwnDisplayScale = scale;

    const Mag_main = Math.pow(3, mainMapGlobalScale - 1);
    const Mag_minimap = Math.pow(3, minimapOwnDisplayScale - 1);

    const minimapTotalWidth =
      minimapOwnDisplayScale === 1
        ? baseHexSize * Math.sqrt(3)
        : baseHexSize * Math.sqrt(3) * Math.pow(3, minimapOwnDisplayScale - 1);
    const minimapTotalHeight =
      minimapOwnDisplayScale === 1
        ? baseHexSize * 2
        : baseHexSize * 2 * Math.pow(3, minimapOwnDisplayScale - 1);

    rX = (viewportData.scrollLeft * Mag_minimap) / Mag_main;
    rY = (viewportData.scrollTop * Mag_minimap) / Mag_main;
    let rW = (viewportData.clientWidth * Mag_minimap) / Mag_main;
    let rH = (viewportData.clientHeight * Mag_minimap) / Mag_main;
    const mainMapScale = parseInt(
      getScaleFromSearchParams(urlInfo.searchParamsString) ?? "0",
      10,
    );
    const offsetFactor = mainMapScale - 3;
    rY -=
      offsetFactor === 1
        ? (1 / 2) * rH
        : ((Math.pow(2, offsetFactor - 1) * 1) / 2) * rH;

    rX = Math.max(0, rX);
    rY = Math.max(0, rY);
    rW = Math.max(0, rW);
    rH = Math.max(0, rH);
    rW = Math.min(rW, minimapTotalWidth - rX);
    rH = Math.min(rH, minimapTotalHeight - rY);
    rW = Math.max(0, rW);
    rH = Math.max(0, rH);

    const handleMouseDownOnRect = (event: React.MouseEvent<SVGRectElement>) => {
      if (!isDraggable || !onViewportDragTo) return;
      event.preventDefault();
      setIsDragging(true);
      dragStartDataRef.current = {
        initialMouseX: event.clientX,
        initialMouseY: event.clientY,
        initialRX: rX,
        initialRY: rY,
      };
    };

    viewportRectToRender = (
      <svg
        width={minimapTotalWidth}
        height={minimapTotalHeight}
        viewBox={`0 0 ${minimapTotalWidth} ${minimapTotalHeight}`}
        className="pointer-events-none absolute left-0 top-0 z-[100]"
      >
        <rect
          x={rX}
          y={rY}
          width={rW}
          height={rH}
          fill="transparent"
          stroke="#FAFAFA"
          strokeWidth="1.5"
          className={
            isDraggable && onViewportDragTo
              ? isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : ""
          }
          style={{
            pointerEvents: isDraggable && onViewportDragTo ? "auto" : "none",
          }}
          onMouseDown={handleMouseDownOnRect}
        />
      </svg>
    );
  }

  const handleWindowMouseMove = useCallback(
    (event: MouseEvent) => {
      if (
        !isDragging ||
        !dragStartDataRef.current ||
        !viewportData ||
        !onViewportDragTo
      )
        return;

      const { initialMouseX, initialMouseY, initialRX, initialRY } =
        dragStartDataRef.current;
      const deltaMouseX = event.clientX - initialMouseX;
      const deltaMouseY = event.clientY - initialMouseY;

      const newRX = initialRX + deltaMouseX;
      const newRY = initialRY + deltaMouseY;

      const minimapOwnDisplayScale = scale;
      const Mag_main = Math.pow(3, mainMapGlobalScale - 1);
      const Mag_minimap = Math.pow(3, minimapOwnDisplayScale - 1);

      if (Mag_minimap === 0) return;

      let newTargetScrollLeft = (newRX * Mag_main) / Mag_minimap;
      let newTargetScrollTop = (newRY * Mag_main) / Mag_minimap;

      newTargetScrollLeft = Math.max(
        0,
        Math.min(
          newTargetScrollLeft,
          viewportData.scrollWidth - viewportData.clientWidth,
        ),
      );
      newTargetScrollTop = Math.max(
        0,
        Math.min(
          newTargetScrollTop,
          viewportData.scrollHeight - viewportData.clientHeight,
        ),
      );

      onViewportDragTo(newTargetScrollLeft, newTargetScrollTop);
    },
    [isDragging, viewportData, onViewportDragTo, scale, mainMapGlobalScale],
  );

  const handleWindowMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartDataRef.current = null;
  }, []);

  useEffect(() => {
    if (!isDragging || !isDraggable) return;

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("mouseleave", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("mouseleave", handleWindowMouseUp);
    };
  }, [isDragging, isDraggable, handleWindowMouseMove, handleWindowMouseUp]);

  if (!centerItem) {
    return (
      <StaticBaseTileLayout
        coordId={center}
        scale={scale}
        baseHexSize={baseHexSize}
      />
    );
  }

  if (!isExpanded) {
    return (
      <StaticMiniMapItemTile
        item={centerItem}
        scale={scale}
        baseHexSize={baseHexSize}
        urlInfo={urlInfo}
      />
    );
  }

  const [NW, NE, E, SE, SW, W] = CoordSystem.getChildCoordsFromId(center);
  const marginTopValue =
    scale === 2 ? baseHexSize / 2 : (baseHexSize / 2) * Math.pow(3, scale - 2);
  const marginTop = { marginTop: `-${marginTopValue}px` };
  const nextScale = (scale - 1) as TileScale;

  const baseChildProps: Omit<
    StaticMiniMapProps,
    "center" | "viewportData" | "scale" | "mainMapGlobalScale"
  > = {
    mapItems,
    baseHexSize,
    expandedItemIds,
    urlInfo,
  };

  const region = (
    <div className="flex flex-col items-center justify-center">
      <div className="flex justify-center p-0">
        <RenderChild coords={NW} {...baseChildProps} scale={nextScale} />
        <RenderChild coords={NE} {...baseChildProps} scale={nextScale} />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild coords={W} {...baseChildProps} scale={nextScale} />
        <div className="flex flex-col">
          <StaticMiniMapItemTile
            item={centerItem}
            scale={nextScale}
            baseHexSize={baseHexSize}
            urlInfo={urlInfo}
          />
        </div>
        <RenderChild coords={E} {...baseChildProps} scale={nextScale} />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild coords={SW} {...baseChildProps} scale={nextScale} />
        <RenderChild coords={SE} {...baseChildProps} scale={nextScale} />
      </div>
    </div>
  );

  return (
    <StaticBaseTileLayout
      scale={scale}
      coordId={center}
      baseHexSize={baseHexSize}
      _shallow={true}
    >
      <div
        className="scale-90 transform"
        style={{ position: "relative", zIndex: 5 }}
      >
        {region}
      </div>
      {viewportRectToRender}
    </StaticBaseTileLayout>
  );
};

interface RenderChildProps {
  coords: string;
  mapItems: Record<string, HexTileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale: TileScale;
  urlInfo: URLInfo;
}

const RenderChild = ({
  coords,
  mapItems,
  baseHexSize,
  expandedItemIds,
  scale,
  urlInfo,
}: RenderChildProps) => {
  const item = mapItems[coords];
  const isExpandedChild = item
    ? expandedItemIds?.includes(item.metadata.dbId)
    : false;

  if (!item) {
    return (
      <StaticBaseTileLayout
        coordId={coords}
        scale={scale}
        baseHexSize={baseHexSize}
      />
    );
  }

  if (isExpandedChild && scale > -2) {
    return (
      <StaticMiniMap
        center={coords}
        mapItems={mapItems}
        baseHexSize={baseHexSize}
        expandedItemIds={expandedItemIds}
        scale={scale}
        urlInfo={urlInfo}
      />
    );
  }

  return (
    <StaticMiniMapItemTile
      item={item}
      scale={scale}
      baseHexSize={baseHexSize}
      urlInfo={urlInfo}
    />
  );
};

function getScaleFromSearchParams(currentSearchParamsString: string): string {
  const params = new URLSearchParams(currentSearchParamsString);
  return params.get("scale") ?? "0";
}
