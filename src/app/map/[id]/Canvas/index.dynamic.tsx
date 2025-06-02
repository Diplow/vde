"use client";

import {
  useEffect,
  useState,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { StaticMapCanvas, type CenterInfo } from "./index.static";
import { useMapCache } from "../Cache/map-cache";
import type { URLInfo } from "../types/url-info";
import { MapLoadingSkeleton } from "./LifeCycle/loading-skeleton";
import { MapErrorBoundary } from "./LifeCycle/error-boundary";

// Simplified Tile Actions Context
export interface TileActionsContextValue {
  handleTileClick: (coordId: string, event: MouseEvent) => void;
  handleTileDrag: (coordId: string, event: DragEvent) => void;
  handleTileHover: (coordId: string, isHovering: boolean) => void;
  onCreateTileRequested?: (coordId: string) => void;
}

export const TileActionsContext = createContext<TileActionsContextValue | null>(
  null,
);

export function useTileActionsContext() {
  const context = useContext(TileActionsContext);

  if (!context) {
    console.error(
      "useTileActionsContext: No context found! Component is not within DynamicMapCanvas",
    );
    throw new Error(
      "useTileActionsContext must be used within DynamicMapCanvas",
    );
  }
  return context;
}

interface DynamicMapCanvasProps {
  centerInfo: CenterInfo;
  expandedItemIds: string[];
  urlInfo: URLInfo;

  // Progressive enhancement options
  fallback?: ReactNode;
  errorBoundary?: ReactNode;
  enableBackgroundSync?: boolean;
  syncInterval?: number;

  // Cache control
  cacheConfig?: {
    maxAge: number;
    backgroundRefreshInterval: number;
    enableOptimisticUpdates: boolean;
    maxDepth: number;
  };
}

export function DynamicMapCanvas({
  centerInfo,
  expandedItemIds,
  urlInfo,
  fallback,
  errorBoundary,
  enableBackgroundSync = true,
  syncInterval = 30000,
  cacheConfig,
}: DynamicMapCanvasProps) {
  const {
    state,
    loadMapRegion,
    hasRequiredDepth,
    invalidateRegion,
    setCenter,
    setExpandedItems,
  } = useMapCache();
  const [isHydrated, setIsHydrated] = useState(false);

  // Feature detection (per ARCHITECTURE.md)
  const [capabilities, setCapabilities] = useState({
    hasJS: false,
    hasLocalStorage: false,
  });

  useEffect(() => {
    // Initialize capabilities and hydration
    setCapabilities({
      hasJS: true,
      hasLocalStorage: typeof localStorage !== "undefined",
    });
    setIsHydrated(true);

    // Initialize cache state with props if not already set
    if (!state.currentCenter) {
      setCenter(centerInfo.center);
    }
    if (state.expandedItemIds.length === 0 && expandedItemIds.length > 0) {
      setExpandedItems(expandedItemIds);
    }
  }, [
    centerInfo.center,
    expandedItemIds,
    state.currentCenter,
    state.expandedItemIds.length,
    setCenter,
    setExpandedItems,
  ]);

  // Simplified tile actions without interaction modes
  const tileActions = useMemo(
    () => ({
      handleTileClick: (coordId: string, event: MouseEvent) => {
        console.log("TileActions: handleTileClick called", { coordId });
        // Default tile click behavior (can be enhanced later)
      },
      handleTileDrag: (coordId: string, _event: DragEvent) => {
        console.log("TileActions: handleTileDrag called", { coordId });
        // TODO: Handle drag operations
      },
      handleTileHover: (coordId: string, isHovering: boolean) => {
        console.log("TileActions: handleTileHover called", {
          coordId,
          isHovering,
        });
        // TODO: Handle hover state
      },
      onCreateTileRequested: (coordId: string) => {
        console.log("Create tile requested:", coordId);
        // This callback is used by empty tiles to signal create requests
      },
    }),
    [],
  );

  // Hierarchical loading with depth control
  useEffect(() => {
    if (!isHydrated) return;

    const currentCenter = state.currentCenter ?? centerInfo.center;
    const requiredDepth = cacheConfig?.maxDepth ?? 3;
    if (!hasRequiredDepth(currentCenter, requiredDepth)) {
      void loadMapRegion(currentCenter, requiredDepth);
    }
  }, [
    state.currentCenter,
    centerInfo.center,
    isHydrated,
    loadMapRegion,
    hasRequiredDepth,
    cacheConfig?.maxDepth,
  ]);

  // Background sync with interval
  useEffect(() => {
    if (!enableBackgroundSync || !isHydrated || !capabilities.hasJS) return;

    const currentCenter = state.currentCenter ?? centerInfo.center;
    const interval = setInterval(() => {
      void loadMapRegion(currentCenter);
    }, syncInterval);

    return () => clearInterval(interval);
  }, [
    state.currentCenter,
    centerInfo.center,
    enableBackgroundSync,
    syncInterval,
    loadMapRegion,
    isHydrated,
    capabilities.hasJS,
  ]);

  // Progressive enhancement fallbacks
  if (!isHydrated || state.isLoading) {
    return fallback ?? <MapLoadingSkeleton />;
  }

  if (state.error) {
    return (
      errorBoundary || (
        <MapErrorBoundary
          error={state.error}
          onRetry={() => invalidateRegion(centerInfo.center)}
        />
      )
    );
  }

  // Use dynamic center and expanded items from cache state
  const currentCenter = state.currentCenter ?? centerInfo.center;
  const currentExpandedItems =
    state.expandedItemIds.length > 0 ? state.expandedItemIds : expandedItemIds;

  // Create dynamic center info
  const dynamicCenterInfo = {
    ...centerInfo,
    center: currentCenter,
  };

  console.log("DynamicMapCanvas: Providing tile actions context", {
    centerCoordId: currentCenter,
  });

  return (
    <TileActionsContext.Provider value={tileActions}>
      <StaticMapCanvas
        centerInfo={dynamicCenterInfo}
        items={state.itemsById}
        expandedItemIds={currentExpandedItems}
        urlInfo={urlInfo}
        currentUserId={centerInfo.userId}
      />
    </TileActionsContext.Provider>
  );
}
