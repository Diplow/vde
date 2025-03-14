"use client";

import { HexCoordinate, HexCoordinateSystem } from "~/lib/hex-coordinates";
import { HexTile } from "./HexTile";

interface MapItem {
  coordinates: HexCoordinate;
  itemType: "resource" | "event" | "content" | "author";
  item: any;
}

interface HexGridProps {
  dimensions: { rows: number; cols: number; baseSize: number };
  items?: MapItem[];
  onTileClick?: (coordinate: HexCoordinate) => void;
  selectedCoordinate?: HexCoordinate | null;
}

export function HexGrid({
  dimensions,
  items = [],
  onTileClick,
  selectedCoordinate,
}: HexGridProps) {
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

          // Find item at this coordinate
          const itemAtCoord = items.find(
            (item) => HexCoordinateSystem.createId(item.coordinates) === hexId,
          );

          // Check if this tile is selected
          const isSelected = selectedCoordinate
            ? HexCoordinateSystem.createId(selectedCoordinate) === hexId
            : false;

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
              <HexTile
                className="h-full w-full"
                isSelected={isSelected}
                onClick={onTileClick ? () => onTileClick(coord) : undefined}
                itemType={itemAtCoord?.itemType}
                item={itemAtCoord?.item}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
