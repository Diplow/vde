"use client";

import type { ReactNode } from "react";
import type { 
  TileScale, 
  TileColor, 
  TileStroke, 
  TileCursor 
} from "~/app/static/map/Tile/Base/base";

export interface DynamicBaseTileLayoutProps {
  coordId: string;
  scale: TileScale;
  color?: TileColor;
  stroke?: TileStroke;
  children?: ReactNode;
  cursor?: TileCursor;
  isFocusable?: boolean;
  baseHexSize?: number;
  _shallow?: boolean;
}

export const DynamicBaseTileLayout = ({
  coordId = "0,0",
  scale = 1,
  color,
  stroke = { color: "transparent", width: 0 },
  children,
  cursor = "cursor-pointer",
  isFocusable = false,
  baseHexSize = 50,
  _shallow = false,
}: DynamicBaseTileLayoutProps) => {
  // Calculate dimensions based on scale
  const width =
    scale === 1
      ? baseHexSize * Math.sqrt(3)
      : baseHexSize * Math.sqrt(3) * Math.pow(3, scale - 1);

  const height =
    scale === 1 ? baseHexSize * 2 : baseHexSize * 2 * Math.pow(3, scale - 1);

  // SVG constants
  const svgPath = "M50 0 L100 28.87 L100 86.6 L50 115.47 L0 86.6 L0 28.87Z";
  const svgViewBox = "0 0 100 115.47";
  const fillClass = color
    ? `fill-${color.color}-${color.tint}`
    : "fill-transparent";

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        isFocusable ? "outline-none" : "" // Remove default outline if focusable
      }`}
      tabIndex={isFocusable ? 0 : undefined}
      role={isFocusable ? "button" : undefined}
      aria-label={isFocusable ? `Tile ${coordId}` : undefined}
      style={{
        width: `${Math.round(width)}px`,
        height,
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
      }}
      data-tile-id={coordId}
    >
      <div
        className={`relative flex flex-shrink-0 items-center justify-center p-0`}
        style={{
          width: "100%", // Ensure inner div takes full size of focusable parent
          height: "100%",
        }}
      >
        <svg
          className={`absolute inset-0 h-full w-full ${cursor} pointer-events-none`} // SVG is absolute to fill the focusable div
          viewBox={svgViewBox}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d={svgPath}
            className={`stroke-${stroke.color} transition-all duration-300 ${fillClass}`}
            strokeWidth={stroke.width}
            strokeLinejoin="round"
          />
        </svg>

        {/* Key change: Allow pointer events on content for scrolling */}
        <div 
          className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden pointer-events-auto"
          style={{
            // Clip content to hexagon shape using CSS clip-path
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};