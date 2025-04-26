"use client";

import { HexCoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { TileContent } from "./TileContent";
import { MapCanvasState } from "../Canvas/State";
import { HexTileData } from "../Canvas/State/types";
import { useDragAndDrop } from "./State/dragandrop";

const scaleSVGs = {
  1: {
    path: "M50 0 L100 28.87 L100 86.6 L50 115.47 L0 86.6 L0 28.87Z",
    viewBox: "0 0 100 115.47",
  },
  2: {
    path: "M50 0 L100 28.87 L100 86.6 L50 115.47 L0 86.6 L0 28.87Z",
    viewBox: "0 0 100 115.47",
  },
} as const;

export function Tile({
  state,
  coords,
}: {
  state: MapCanvasState;
  coords: string;
}) {
  const scale = state.data.scale.scaleLevels[coords] as number;
  if (!scale) throw new Error("Scale shall not be 0 or undefined");
  const item = state.data.mapItems[coords];

  const IS_EMPTY = !item;
  const getFillColor = (item?: HexTileData) => {
    if (item?.data.color) return `fill-${item.data.color}`;
    return "fill-zinc-300 hover:fill-zinc-300/20";
  };
  const fillClass = getFillColor(item);

  // Check if this is the center tile (center tile has no parent)
  const isCenter = HexCoordSystem.getParentCoordFromId(coords) === undefined;

  const baseHexWidth = state.data.scale.baseHexSize * Math.sqrt(3);
  const baseHexHeight = state.data.scale.baseHexSize * 2;

  // New size multiplier for scale 2 (3 times larger than scale 1)
  const scaleFactors = {
    width: scale === 2 ? 3 : 3,
    height: scale === 2 ? 3 : 2.5,
  };

  // Calculate effective size for responsive content
  const effectiveSize =
    state.data.scale.baseHexSize * Math.pow(scale === 2 ? 3 : 3, scale - 1);

  // Determine content display level based on effective size
  const contentDisplayLevel =
    effectiveSize < 50 ? "minimal" : effectiveSize < 120 ? "medium" : "full";

  // Use our custom drag and drop hook
  const {
    isDragging,
    isDragOver,
    isDraggable,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    cursorStyle,
  } = useDragAndDrop({
    coords,
    item,
    state,
    isCenter,
    baseHexWidth,
    baseHexHeight,
    scale,
    effectiveSize,
    scaleSVGs,
  });

  // Handle tile click - if we're in focus mode, use the standard select handler
  const handleTileClick = (e: React.MouseEvent) => {
    // Handle Ctrl+Shift+click for deep expansion
    if (e.ctrlKey && e.shiftKey && item) {
      e.stopPropagation();
      state.actions.scale.deepExpand(coords);
      return;
    }

    // Handle Ctrl+click for expand/collapse
    if (e.ctrlKey && item) {
      e.stopPropagation();
      if (!state.data.scale.expandedItems[coords]) {
        // If we only have expand action, the tile is collapsed
        state.actions.scale.expand(coords);
      } else {
        // If we only have collapse action, the tile is expanded
        state.actions.scale.collapse(coords);
      }
      return;
    }

    state.actions.selection.select(coords);
  };

  // Handle creation of a new item
  const handleCreate = (data: {
    title?: string;
    descr?: string;
    url?: string;
  }) => {
    const parsedCoords = HexCoordSystem.parseId(coords);
    state.actions.mutations.createItem({
      coords: parsedCoords,
      title: data.title || "",
      descr: data.descr || "",
      url: data.url || "",
    });
  };

  // Handle updating an existing item
  const handleUpdate = (data: {
    title?: string;
    descr?: string;
    url?: string;
  }) => {
    if (item) {
      state.actions.mutations.updateItem({
        itemId: item.metadata.coordId,
        data,
      });
    }
  };

  // Handle deleting an item
  const handleDelete = () => {
    if (item) {
      if (window.confirm("Are you sure you want to delete this item?")) {
        state.actions.mutations.deleteItem({
          itemId: item.metadata.dbId,
        });
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center`}>
      <div
        className={`group relative flex flex-shrink-0 items-center justify-center p-0 ${isDragging ? "opacity-50" : ""}`}
        style={{
          width: baseHexWidth * Math.pow(scaleFactors.width, scale - 1),
          height: baseHexHeight * Math.pow(scaleFactors.height, scale - 1),
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        data-tile-id={coords}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg
          className={`h-full w-full ${cursorStyle} transition-all duration-300 hover:opacity-90 ${isDragOver ? "opacity-70" : ""}`}
          viewBox={scaleSVGs[scale as keyof typeof scaleSVGs].viewBox}
          xmlns="http://www.w3.org/2000/svg"
          onClick={handleTileClick}
          preserveAspectRatio="xMidYMid meet"
        >
          <title>
            {item
              ? "Click to select. Ctrl+Click to expand/collapse."
              : "Empty tile"}
          </title>
          <path
            d={scaleSVGs[scale as keyof typeof scaleSVGs].path}
            className={`transition-all duration-300 ${
              state.data.selection.selection === coords
                ? `stroke-zinc-950`
                : "stroke-hex-border"
            } ${fillClass} ${isDragOver ? "fill-zinc-300/40" : ""}`}
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>

        {/* Render content */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <TileContent
            item={item}
            displayLevel={contentDisplayLevel}
            textSize={
              effectiveSize < 50
                ? "text-[8px]"
                : effectiveSize < 80
                  ? "text-xs"
                  : effectiveSize < 120
                    ? "text-sm"
                    : effectiveSize < 150
                      ? "text-base"
                      : effectiveSize < 180
                        ? "text-lg"
                        : effectiveSize < 210
                          ? "text-xl"
                          : effectiveSize < 240
                            ? "text-2xl"
                            : effectiveSize < 270
                              ? "text-3xl"
                              : "text-4xl"
            }
            isSelected={state.data.selection.selection === coords}
            onUpdate={handleUpdate}
            onCreate={IS_EMPTY ? handleCreate : undefined}
            updateError={state.lifeCycle.mutations.itemUpdateError}
            createError={state.lifeCycle.mutations.itemCreationError}
          />
        </div>
      </div>
    </div>
  );
}
