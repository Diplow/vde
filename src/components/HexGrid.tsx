"use client";

import { HexCoordinate, HexCoordinateSystem } from "~/lib/hex-coordinates";
import { HexTile } from "./HexTile";

interface HexGridProps {
  dimensions: { rows: number; cols: number; baseSize: number };
}

export function HexGrid({ dimensions }: HexGridProps) {
  const { rows, cols, baseSize } = dimensions;

  // Generate visible hexes based on zoom level
  const hexes: HexCoordinate[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      hexes.push({ row, col, path: [] });
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="relative">
        {hexes.map((coord) => {
          const hexId = HexCoordinateSystem.createId(coord);
          const { x, y } = HexCoordinateSystem.getRelativePosition(coord);

          return (
            <div
              key={hexId}
              className="absolute transition-all duration-300"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${baseSize}px`,
                height: `${baseSize}px`,
              }}
            >
              <HexTile className="h-full w-full" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
