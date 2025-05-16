import { ReactNode } from "react";

export type TileCursor =
  | "cursor-pointer"
  | "cursor-grab" // for draggable tiles
  | "cursor-grabbing" // for dragging tiles
  | "cursor-crosshair" // for selecting tiles
  | "cursor-not-allowed" // for locked tiles
  | "cursor-zoom-in" // for expandable tiles
  | "cursor-zoom-out"; // for expanded tiles

export type TileStroke = {
  color: "transparent" | "zinc-950" | "zinc-50";
  width: number;
};

export type TileScale = -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TileColor = {
  color: "zinc" | "amber" | "emerald" | "fuchsia" | "rose" | "indigo" | "cyan";
  tint:
    | "50"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900"
    | "950";
};

export interface StaticBaseTileLayoutProps {
  coordId: string;
  scale: TileScale;
  color?: TileColor;
  stroke?: TileStroke;
  children?: ReactNode;
  cursor?: TileCursor;
  isFocusable?: boolean;
  baseHexSize?: number;
  shallow?: boolean;
}

export const StaticBaseTileLayout = ({
  coordId = "0,0",
  scale = 1,
  color,
  stroke = { color: "transparent", width: 1 },
  children,
  cursor = "cursor-pointer",
  isFocusable = false,
  baseHexSize = 50,
  shallow = false,
}: StaticBaseTileLayoutProps) => {
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
        position: "relative", // Keep relative for absolute positioning of children
      }}
      data-tile-id={coordId}
    >
      <div
        className={`relative flex flex-shrink-0 items-center justify-center p-0`}
        style={{
          width: "100%", // Ensure inner div takes full size of focusable parent
          height: "100%",
          // zIndex: 20 - scale, // zIndex might be better on the root of this component or handled by parent
        }}
      >
        <svg
          className={`absolute inset-0 h-full w-full ${cursor}`} // SVG is absolute to fill the focusable div
          // style={{ zIndex: 20 - scale }} // SVG zIndex
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
        {/* Ensure children are rendered on top and can receive pointer events */}
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
