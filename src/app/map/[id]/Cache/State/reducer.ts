import type { CacheState, CacheAction } from "./types";
import { ACTION_TYPES } from "./types";
import type { HexTileData } from "../../State/types";
import type { MapItemAPIContract } from "~/server/api/types/contracts";
import { adapt } from "../../State/types";

// Initial state for the cache
export const initialCacheState: CacheState = {
  itemsById: {},
  regionMetadata: {},
  currentCenter: null,
  expandedItemIds: [],
  isLoading: false,
  error: null,
  lastUpdated: 0,
  cacheConfig: {
    maxAge: 300000, // 5 minutes
    backgroundRefreshInterval: 30000, // 30 seconds
    enableOptimisticUpdates: true,
    maxDepth: 3,
  },
};

// Pure helper functions for reducer logic
const formatItems = (items: MapItemAPIContract[]): HexTileData[] => {
  return items
    .map((item) => {
      try {
        return adapt(item);
      } catch (error) {
        // Skip items that can't be adapted (malformed coordinates, etc.)
        return null;
      }
    })
    .filter((item): item is HexTileData => {
      if (!item) return false;
      // Filter out items with zero in path
      return !item.metadata.coordinates.path.includes(0);
    });
};

const createRegionKey = (centerCoordId: string): string => {
  // Simple region key creation - can be enhanced later
  return centerCoordId;
};

const hasDataChanges = (
  oldItems: Record<string, HexTileData>,
  newItems: Record<string, HexTileData>,
): boolean => {
  const newKeys = Object.keys(newItems);

  for (const key of newKeys) {
    const oldItem = oldItems[key];
    const newItem = newItems[key];

    if (
      !oldItem ||
      oldItem.data.name !== newItem?.data.name ||
      oldItem.data.description !== newItem?.data.description
    ) {
      return true;
    }
  }

  return false;
};

// Pure reducer function
export function cacheReducer(
  state: CacheState,
  action: CacheAction,
): CacheState {
  switch (action.type) {
    case ACTION_TYPES.LOAD_REGION: {
      const { items, centerCoordId, maxDepth } = action.payload;
      const newItems = formatItems(items);
      const regionKey = createRegionKey(centerCoordId);

      // Create new items map without mutation
      const updatedItems = { ...state.itemsById };
      newItems.forEach((item) => {
        updatedItems[item.metadata.coordId] = item;
      });

      // Create new region metadata
      const newRegionMetadata = {
        ...state.regionMetadata,
        [regionKey]: {
          centerCoordId,
          maxDepth,
          loadedAt: Date.now(),
          itemCoordIds: newItems.map((item) => item.metadata.coordId),
        },
      };

      return {
        ...state,
        itemsById: updatedItems,
        regionMetadata: newRegionMetadata,
        lastUpdated: Date.now(),
        error: null,
      };
    }

    case ACTION_TYPES.LOAD_ITEM_CHILDREN: {
      const { items, parentCoordId, maxDepth } = action.payload;
      const newItems = formatItems(items);

      // Check for changes to prevent unnecessary updates
      const newItemsById = newItems.reduce(
        (acc, item) => {
          acc[item.metadata.coordId] = item;
          return acc;
        },
        {} as Record<string, HexTileData>,
      );

      const hasChanges = hasDataChanges(state.itemsById, newItemsById);
      if (!hasChanges) {
        return state;
      }

      // Create updated items without mutation
      const updatedItems = { ...state.itemsById };
      newItems.forEach((item) => {
        updatedItems[item.metadata.coordId] = item;
      });

      return {
        ...state,
        itemsById: updatedItems,
        lastUpdated: Date.now(),
      };
    }

    case ACTION_TYPES.SET_CENTER: {
      return {
        ...state,
        currentCenter: action.payload,
      };
    }

    case ACTION_TYPES.SET_EXPANDED_ITEMS: {
      return {
        ...state,
        expandedItemIds: [...action.payload], // Create new array
      };
    }

    case ACTION_TYPES.TOGGLE_ITEM_EXPANSION: {
      const itemId = action.payload;
      const isExpanded = state.expandedItemIds.includes(itemId);
      const newExpandedItems = isExpanded
        ? state.expandedItemIds.filter((id) => id !== itemId)
        : [...state.expandedItemIds, itemId];

      return {
        ...state,
        expandedItemIds: newExpandedItems,
      };
    }

    case ACTION_TYPES.SET_LOADING: {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    case ACTION_TYPES.SET_ERROR: {
      return {
        ...state,
        error: action.payload,
      };
    }

    case ACTION_TYPES.INVALIDATE_REGION: {
      const regionKey = action.payload;
      const newRegionMetadata = { ...state.regionMetadata };
      delete newRegionMetadata[regionKey];

      return {
        ...state,
        regionMetadata: newRegionMetadata,
      };
    }

    case ACTION_TYPES.INVALIDATE_ALL: {
      return {
        ...state,
        itemsById: {},
        regionMetadata: {},
        lastUpdated: 0,
      };
    }

    case ACTION_TYPES.UPDATE_CACHE_CONFIG: {
      return {
        ...state,
        cacheConfig: {
          ...state.cacheConfig,
          ...action.payload,
        },
      };
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = action;
      return state;
    }
  }
}
