"use client";

import {
  ContentIndicator,
  ResourceIndicator,
  EventIndicator,
  AuthorIndicator,
} from "./indicators";

interface HexTileProps {
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  itemType?: "resource" | "event" | "content" | "author";
  item?: any; // The item data to display
}

export function HexTile({
  className = "w-16 h-16",
  stroke = "hex-border",
  strokeWidth = 2,
  isSelected = false,
  onClick,
  itemType,
  item,
}: HexTileProps) {
  // Hexagon points are calculated for a perfect hexagon
  // Using pointy-topped hexagon (rotated 30 degrees from flat-topped)
  return (
    <svg
      className={`${className} transition-all duration-200 hover:opacity-90`}
      viewBox="0 0 100 116"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <path
        d="M50 0
           L93.3 25
           L93.3 75
           L50 100
           L6.7 75
           L6.7 25
           Z"
        className={`stroke-hex-border transition-all duration-200 hover:stroke-hex-border-hover ${isSelected ? "fill-secondary-400 stroke-primary-900" : "fill-hex-fill hover:fill-hex-fill-hover"} `}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {item && (
        <foreignObject width="100" height="116" x="0" y="0">
          <div className="flex h-full w-full items-center justify-center p-2">
            {itemType === "content" && <ContentIndicator content={item} />}
            {itemType === "resource" && <ResourceIndicator resource={item} />}
            {itemType === "event" && <EventIndicator event={item} />}
            {itemType === "author" && <AuthorIndicator author={item} />}
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
