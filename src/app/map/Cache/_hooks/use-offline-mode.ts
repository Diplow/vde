import { useEffect, useRef, useCallback } from "react";
import type { Dispatch } from "react";
import type { CacheState, CacheAction } from "../State/types";
import type { StorageService } from "../Services/types";
import type { TileData } from "../../types/tile-data";
import { cacheActions } from "../State/actions";
import { STORAGE_KEYS } from "../Services/storage-service";
import { MapItemType } from "~/lib/domains/mapping/_objects/map-item";

interface CachedData {
  items: Record<string, TileData>;
  center?: string | null;
  maxDepth?: number;
  timestamp?: number;
}

interface OfflineModeConfig {
  enabled: boolean;
  dispatch: Dispatch<CacheAction>;
  state: CacheState;
  storageService: StorageService;
  onInitialLoad?: (data: CachedData) => void;
  syncEnabled?: boolean; // New flag to enable localStorage sync even when online
}

/**
 * Hook that manages offline mode functionality including:
 * - Loading initial data from localStorage
 * - Syncing cache state to localStorage
 * - Detecting online/offline status
 */
export function useOfflineMode({
  enabled,
  dispatch,
  state,
  storageService,
  onInitialLoad,
  syncEnabled = true, // Default to syncing with localStorage
}: OfflineModeConfig) {
  const hasLoadedFromStorage = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial data from localStorage on mount (only when offline)
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    
    // Only load from storage when offline
    if (!enabled) return;

    const loadFromStorage = async () => {
      try {
        // Load cache data
        const cachedData = await storageService.loadCacheData() as CachedData | null;
        
        // Only load from storage if we're offline
        // When online, the server will provide the data
        if (cachedData?.items && enabled) {
          // Convert items to array format for loadRegion action
          const itemsArray = Object.values(cachedData.items).map((tile: TileData) => ({
            id: String(tile.metadata.dbId),
            coordinates: tile.metadata.coordId,
            depth: tile.metadata.depth,
            name: tile.data.name,
            descr: tile.data.description,
            url: tile.data.url,
            parentId: tile.metadata.parentId ?? null,
            itemType: MapItemType.BASE,
            ownerId: tile.metadata.ownerId,
          }));

          // Load items into cache
          if (cachedData.center) {
            dispatch(cacheActions.loadRegion(
              itemsArray,
              cachedData.center,
              cachedData.maxDepth ?? 3
            ));
          }

          // Set center if available
          if (cachedData.center) {
            dispatch(cacheActions.setCenter(cachedData.center));
          }

          // Call the callback if provided
          onInitialLoad?.(cachedData);
        }

        // Load expanded items
        const expandedItems = await storageService.loadExpandedItems();
        if (expandedItems.length > 0) {
          expandedItems.forEach(itemId => {
            dispatch(cacheActions.toggleItemExpansion(itemId));
          });
        }

        hasLoadedFromStorage.current = true;
      } catch (error) {
        console.error("[OfflineMode] Failed to load from storage:", error);
      }
    };

    void loadFromStorage();
  }, [enabled, dispatch, storageService, onInitialLoad]);

  // Debounced save function
  const saveToStorage = useCallback(async () => {
    if (!enabled && !syncEnabled) return;

    try {
      // Save cache data
      await storageService.saveCacheData({
        items: state.itemsById,
        center: state.currentCenter,
        maxDepth: state.cacheConfig.maxDepth,
        timestamp: Date.now(),
      });

      // Save expanded items
      await storageService.saveExpandedItems(state.expandedItemIds);
    } catch (error) {
      console.error("[OfflineMode] Failed to save to storage:", error);
    }
  }, [enabled, syncEnabled, state, storageService]);

  // Save to localStorage when state changes (debounced)
  useEffect(() => {
    if (!enabled && !syncEnabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves by 1 second to avoid excessive writes
    saveTimeoutRef.current = setTimeout(() => {
      void saveToStorage();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, state.itemsById, state.expandedItemIds, state.currentCenter, saveToStorage, syncEnabled]);

  // Listen for online/offline events
  useEffect(() => {
    if (!enabled && !syncEnabled) return;

    const handleOnline = () => {
      // In the future, this could trigger sync
    };

    const handleOffline = () => {
      // Ensure data is saved when going offline
      void saveToStorage();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [enabled, saveToStorage, syncEnabled]);

  // Save on page unload
  useEffect(() => {
    if (!enabled && !syncEnabled) return;

    const handleBeforeUnload = () => {
      // Synchronous save on unload
      const data = {
        items: state.itemsById,
        center: state.currentCenter,
        maxDepth: state.cacheConfig.maxDepth,
        timestamp: Date.now(),
      };
      
      try {
        window.localStorage.setItem(
          STORAGE_KEYS.CACHE_DATA,
          JSON.stringify({ data, metadata: { version: 1, timestamp: Date.now() } })
        );
        window.localStorage.setItem(
          STORAGE_KEYS.EXPANDED_ITEMS,
          JSON.stringify({ data: state.expandedItemIds, metadata: { version: 1, timestamp: Date.now() } })
        );
      } catch (error) {
        console.error("[OfflineMode] Failed to save on unload:", error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, state, syncEnabled]);

  return {
    isOffline: enabled && typeof window !== "undefined" && !navigator.onLine,
    hasLoadedFromStorage: hasLoadedFromStorage.current,
    saveToStorage,
  };
}