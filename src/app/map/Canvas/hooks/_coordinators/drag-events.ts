import type { DragEvent } from "react";
import type { DragState } from "../types";
import type { TileData } from "~/app/map/types/tile-data";

export function setupDragStart(
  event: DragEvent<HTMLDivElement>,
  coordId: string
): void {
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("tileId", coordId);
}

export function setupDragOver(
  event: DragEvent<HTMLDivElement>,
  isValid: boolean
): void {
  if (!isValid) return;
  
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

export function handleDropEvent(
  event: DragEvent<HTMLDivElement>
): void {
  event.preventDefault();
}

export function createDragState(
  coordId: string,
  tile: TileData,
  event: DragEvent<HTMLDivElement>
): DragState {
  return {
    isDragging: true,
    draggedTileId: coordId,
    draggedTileData: tile,
    dropTargetId: null,
    dragOffset: { 
      x: event.nativeEvent.offsetX, 
      y: event.nativeEvent.offsetY 
    },
  };
}

export function updateDropTarget(
  state: DragState,
  targetId: string | null
): DragState {
  return {
    ...state,
    dropTargetId: targetId,
  };
}