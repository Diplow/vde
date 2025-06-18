import type { TileData } from "~/app/map/types/tile-data";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { cacheSelectors } from "~/app/map/Cache/State/selectors";
import type { Coord } from "~/lib/domains/mapping/utils/hex-coordinates";

export type CacheSelectors = ReturnType<typeof cacheSelectors>;

export interface MoveMapItemMutation {
  mutateAsync: (params: {
    oldCoords: Coord;
    newCoords: Coord;
  }) => Promise<{
    movedItemId: string;
    modifiedItems: ServerModifiedItem[];
  }>;
}

export interface ServerModifiedItem {
  id: string;
  coords: string;
  depth: number;
  name: string;
  descr: string;
  url: string;
  parentId: string | null;
  itemType: string;
  ownerId: string;
}

export interface OptimisticMoveConfig {
  tile: TileData;
  newCoordsId: string;
  cacheState: CacheState;
  selectors: CacheSelectors;
  updateCache?: (updater: (state: CacheState) => CacheState) => void;
  moveMapItemMutation: MoveMapItemMutation;
  onMoveComplete?: (movedItemId: string) => void;
  onMoveError?: (error: Error) => void;
}

export interface MoveOperation {
  type: 'move' | 'swap';
  sourceTile: TileData;
  targetTile?: TileData;
  sourceCoords: Coord;
  targetCoords: Coord;
}

export interface MoveResult {
  movedItemId: string;
  modifiedItems: ServerModifiedItem[];
}