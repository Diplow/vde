"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react"; // Assuming lucide-react for icons
import { StaticMiniMap } from "../Canvas/mini-map.static";
import type { HexTileData } from "../State/types";
import type { TileScale } from "../Tile/base.static"; // Import TileScale

interface MiniMapControllerProps {
  expandedItemIds: string[]; // Changed to minimapItemsData
  minimapItemsData: Record<string, HexTileData>; // Expecting actual item data for minimap
  currentMapCenterCoordId: string; // Might be useful later for default viewport of minimap
}

interface ViewportData {
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

const MINIMAP_TILE_SIZE_APPROX = 80; // Approximate fixed size for the minimap container

export function MiniMapController({
  expandedItemIds,
  minimapItemsData,
  currentMapCenterCoordId,
}: MiniMapControllerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [viewportData, setViewportData] = useState<ViewportData | null>(null);
  const scrollableMapElementRef = useRef<HTMLElement | null>(null); // Ref for the scrollable element

  // Get main map scale from URL parameters
  const mainMapUrlScaleParam = searchParams.get("scale");
  // Default to 0 if not present or invalid, needs to be TileScale compatible.
  // Assuming the URL scale directly corresponds to a TileScale value.
  const mainMapGlobalScale = parseInt(
    mainMapUrlScaleParam ?? "0",
    10,
  ) as TileScale;

  const handleToggleMinimap = () => {
    setIsMinimapVisible((prev) => !prev);
  };

  useEffect(() => {
    const scrollableElement = document.querySelector<HTMLElement>(
      `[data-canvas-id="${currentMapCenterCoordId}"]`,
    );

    const target = scrollableElement ?? document.documentElement;
    scrollableMapElementRef.current = target; // Store in ref

    const handleScrollOrResize = () => {
      // Use properties from the target
      setViewportData({
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft,
        clientWidth: target.clientWidth,
        clientHeight: target.clientHeight,
        scrollWidth: target.scrollWidth,
        scrollHeight: target.scrollHeight,
      });
    };

    // Initial call
    handleScrollOrResize();

    target.addEventListener("scroll", handleScrollOrResize, {
      passive: true,
    });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [currentMapCenterCoordId]); // Add currentMapCenterCoordId to dependency array

  const handleViewportDragTo = (
    newScrollLeft: number,
    newScrollTop: number,
  ) => {
    if (scrollableMapElementRef.current) {
      scrollableMapElementRef.current.scrollLeft = newScrollLeft;
      scrollableMapElementRef.current.scrollTop = newScrollTop;
    }
  };

  // Effect to scroll the main map when the 'focus' URL parameter changes
  useEffect(() => {
    const focusCoordId = searchParams.get("focus");
    const item = Object.values(minimapItemsData).find(
      (item: HexTileData) => item.metadata.dbId === focusCoordId,
    );
    if (focusCoordId) {
      // Timeout to allow DOM to update, especially after navigation
      setTimeout(() => {
        const targetTile = document.querySelector(
          `[data-tile-id="${item?.metadata.coordId}"]`,
        );
        if (targetTile) {
          targetTile.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        } else {
          console.warn(
            `[MiniMapController] Tile with id ${focusCoordId} not found for focusing.`,
          );
        }
      }, 100); // Small delay, adjust if needed
    }
  }, [searchParams, minimapItemsData]); // Rerun when searchParams (and thus 'focus') changes

  if (parseInt(mainMapUrlScaleParam ?? "0", 10) < 4) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col items-end">
      {isMinimapVisible ? (
        <div
          className="relative overflow-hidden rounded-lg border border-neutral-600 bg-neutral-800/60 shadow-xl"
          style={{
            width: `${MINIMAP_TILE_SIZE_APPROX * 3.5}px`, // Example: approx 4 tiles wide
            height: `${MINIMAP_TILE_SIZE_APPROX * 3.2}px`, // Example: approx 3 tiles high
            // Actual dimensions will depend on map aspect ratio and tile layout
          }}
        >
          <button
            onClick={handleToggleMinimap}
            className="absolute right-1 top-1 z-20 rounded bg-neutral-700/70 p-1 text-white shadow-md hover:bg-neutral-600/90 focus:outline-none focus:ring-1 focus:ring-neutral-500 focus:ring-opacity-75"
            aria-label="Hide minimap"
          >
            <Minimize2 size={16} />
          </button>
          <div className="flex h-full w-full flex-col items-center justify-start overflow-auto p-2 pt-6">
            <StaticMiniMap
              center={currentMapCenterCoordId}
              mapItems={minimapItemsData}
              baseHexSize={50}
              expandedItemIds={expandedItemIds}
              scale={2}
              pathname={pathname}
              currentSearchParamsString={searchParams.toString()}
              viewportData={viewportData}
              mainMapGlobalScale={mainMapGlobalScale}
              onViewportDragTo={handleViewportDragTo}
              isDraggable={true}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={handleToggleMinimap}
          className="rounded bg-neutral-700 p-2 text-white shadow-lg hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-opacity-50"
          aria-label="Show minimap"
        >
          <Maximize2 size={16} />
        </button>
      )}
    </div>
  );
}
