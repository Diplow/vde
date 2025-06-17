import type { DragEvent } from "react";
import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { Coord } from "~/lib/domains/mapping/utils/hex-coordinates";

export interface DragState {
  isDragging: boolean;
  draggedTileId: string | null;
  draggedTileData: TileData | null;
  dropTargetId: string | null;
  dragOffset: { x: number; y: number };
}

export interface MoveMapItemMutation {
  mutateAsync: (params: {
    oldCoords: Coord;
    newCoords: Coord;
  }) => Promise<{
    modifiedItems: Array<{
      id: string;
      coords: string;
      depth: number;
      name: string;
      descr: string;
      url: string;
      parentId: string | null;
      itemType: string;
      ownerId: string;
    }>;
    movedItemId: string;
    affectedCount: number;
  }>;
}

export interface UseDragAndDropConfig {
  cacheState: CacheState;
  currentUserId: number | null;
  moveMapItemMutation: MoveMapItemMutation;
  onMoveComplete?: (movedItemId: string) => void;
  onMoveError?: (error: Error) => void;
  updateCache?: (updater: (state: CacheState) => CacheState) => void;
}

export interface DragHandlers {
  onDragStart: (coordId: string, event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (targetCoordId: string, event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (targetCoordId: string, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

export interface UseDragAndDropReturn {
  dragState: DragState;
  dragHandlers: DragHandlers;
  canDragTile: (id: string) => boolean;
  isValidDropTarget: (id: string) => boolean;
  isDraggingTile: (id: string) => boolean;
  isDropTarget: (id: string) => boolean;
  isDragging: boolean;
}