import type { TileData } from "~/app/map/types/tile-data";
import type { Coord } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { CacheState } from "~/app/map/Cache/State/types";
import type { cacheSelectors } from "~/app/map/Cache/State/selectors";

export type CacheSelectors = ReturnType<typeof cacheSelectors>;

export interface SwapMapItemMutation {
  mutateAsync: (params: {
    coordsA: Coord;
    coordsB: Coord;
  }) => Promise<{
    swappedItems: Array<{
      id: string;
      coordinates: string;
      depth: number;
      name: string;
      descr: string;
      url: string;
      parentId: string | null;
      itemType: string;
      ownerId: string;
    }>;
  }>;
}

export interface OptimisticSwapConfig {
  tileA: TileData;
  tileB: TileData;
  cacheState: CacheState;
  selectors: CacheSelectors;
  updateCache?: (updater: (state: CacheState) => CacheState) => void;
  swapMapItemMutation: SwapMapItemMutation;
  onSwapComplete?: () => void;
  onSwapError?: (error: Error) => void;
}

export interface SwapResult {
  swappedItems: ServerSwapItem[];
}

export interface ServerSwapItem {
  id: string;
  coordinates: string;
  parentId: string | null;
}