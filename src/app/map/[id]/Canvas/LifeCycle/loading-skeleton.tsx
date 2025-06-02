"use client";

import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { StaticHexRegion } from "../hex-region.static";
import type { HexTileData } from "../../State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { URLInfo } from "../../types/url-info";

interface MapLoadingSkeletonProps {
  className?: string;
  message?: string;
  blinkingFrequency?: number;
}

export const DEFAULT_BLINKING_FREQUENCY = 400;
// Create mock items for the loading skeleton
const createMockItem = (
  coordId: string,
  name: string,
  color: "zinc-100" | "zinc-200" | "zinc-300",
  depth = 0,
  parentId?: string,
): HexTileData => ({
  metadata: {
    dbId: `mock-${coordId.replace(",", "-")}`,
    coordId,
    parentId,
    coordinates: CoordSystem.parseId(coordId),
    depth,
  },
  data: {
    name,
    description: "",
    url: "",
    color: color,
  },
  state: {
    isDragged: false,
    isHovered: false,
    isSelected: false,
    isExpanded: false,
    isDragOver: false,
    isHovering: false,
  },
});

export function MapLoadingSkeleton({
  className,
  message = "Loading map...",
  blinkingFrequency = DEFAULT_BLINKING_FREQUENCY,
}: MapLoadingSkeletonProps) {
  const [colorPattern, setColorPattern] = useState(true);

  // Mock center coordinate
  const centerCoord = "0,0";

  // Create child coordinates
  const childCoords = CoordSystem.getChildCoordsFromId(centerCoord);

  // Create mock URL info
  const mockUrlInfo: URLInfo = {
    pathname: "/map/loading",
    searchParamsString: "",
    rootItemId: "loading",
  };

  // Animate between color patterns
  useEffect(() => {
    const interval = setInterval(() => {
      setColorPattern((prev) => !prev);
    }, blinkingFrequency);

    return () => clearInterval(interval);
  }, []);

  // Create mock items with alternating colors based on pattern
  const getChildColor = (index: number): "zinc-200" | "zinc-300" => {
    const isEven = index % 2 === 0;
    if (colorPattern) {
      return isEven ? "zinc-200" : "zinc-300";
    } else {
      return isEven ? "zinc-300" : "zinc-200";
    }
  };

  const mockMapItems: Record<string, HexTileData> = {
    [centerCoord]: createMockItem(centerCoord, message, "zinc-100", 0),
    ...childCoords.reduce(
      (acc, coordId, index) => {
        acc[coordId] = createMockItem(
          coordId,
          "",
          getChildColor(index),
          1,
          centerCoord,
        );
        return acc;
      },
      {} as Record<string, HexTileData>,
    ),
  };

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      <div className="grid flex-grow place-items-center overflow-auto p-4">
        {/* Accessible loading indicator */}
        <div className="relative" role="status" aria-label={message}>
          <StaticHexRegion
            center={centerCoord}
            mapItems={mockMapItems}
            baseHexSize={50}
            expandedItemIds={[`mock-${centerCoord.replace(",", "-")}`]} // Use dbId for expansion
            scale={3}
            urlInfo={mockUrlInfo}
            interactive={false}
          />

          {/* Screen reader text */}
          <span className="sr-only">{message}</span>
        </div>
      </div>
    </div>
  );
}
