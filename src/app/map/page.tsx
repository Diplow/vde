"use client";

import { use } from "react";
import { DynamicMapCanvas } from "./Canvas";
import { MapCacheProvider } from "./Cache/map-cache";
import { ParentHierarchy } from "./Controls/ParentHierarchy/parent-hierarchy";
import { MapControls } from "./Controls";
import { useMapIdResolution } from "./_hooks/use-map-id-resolution";
import { MapLoadingSkeleton } from "./Canvas/LifeCycle/loading-skeleton";
import { OfflineIndicator } from "./_components/offline-indicator";
import { TileActionsProvider } from "./Canvas/TileActionsContext";
import { Toolbox } from "./Controls/Toolbox/Toolbox";
import { ToolStateManager } from "./Controls/Toolbox/ToolStateManager";
import { MapContent } from "./_components/MapContent";

interface MapPageProps {
  searchParams: Promise<{
    center?: string;
    scale?: string;
    expandedItems?: string;
    focus?: string;
    offline?: string;
  }>;
}

const CACHE_CONFIG = {
  maxAge: 300000, // 5 minutes
  backgroundRefreshInterval: 30000, // 30 seconds
  enableOptimisticUpdates: true,
  maxDepth: 3, // Hierarchical loading depth
};

// localStorage sync is always enabled. To test:
// 1. Load a map while online
// 2. Data is automatically saved to localStorage
// 3. Add ?offline=true to URL or disconnect network
// 4. Refresh - data loads from localStorage

export default function MapPage({ searchParams }: MapPageProps) {
  // Use React 18's use() to unwrap the promise synchronously
  const params = use(searchParams);
  
  // Handle missing center
  const isOffline = params.offline === 'true';
  
  // Resolve mapItemId to coordinates BEFORE passing to cache
  // This ensures the cache only ever sees proper coordinates
  const { 
    centerCoordinate, 
    userId, 
    groupId, 
    rootItemId, 
    isLoading: isResolving, 
    error: resolutionError 
  } = useMapIdResolution(params.center ?? '');

  if (!params.center) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">No map specified</h1>
          <p className="mt-2 text-gray-600">
            Please provide a map center ID in the URL
          </p>
        </div>
      </div>
    );
  }
  
  // Show loading while resolving mapItemId
  if (isResolving) {
    return <MapLoadingSkeleton message="Loading map..." state="initializing" />;
  }
  
  // Show error if resolution failed
  if (resolutionError || !centerCoordinate) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Map not found</h1>
          <p className="mt-2 text-gray-600">
            {resolutionError?.message ?? "Unable to load the requested map"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      <TileActionsProvider>
        <ToolStateManager mapCenterCoordId={centerCoordinate}>
          <MapContent>
            <MapCacheProvider
            initialItems={{}} // Start with empty items - cache will load from server
            initialCenter={centerCoordinate} // Now always a proper coordinate!
            initialExpandedItems={params.expandedItems?.split(",") ?? []}
            cacheConfig={CACHE_CONFIG}
            offlineMode={isOffline}
            mapContext={{
              rootItemId,
              userId,
              groupId,
            }}
            testingOverrides={{
              disableSync: true, // Disable sync until basic cache is working
            }}
          >
        <DynamicMapCanvas
          centerInfo={{
            center: centerCoordinate,
            rootItemId,
            userId,
            groupId,
          }}
          expandedItemIds={params.expandedItems?.split(",") ?? []}
          urlInfo={{
            pathname: `/map`,
            searchParamsString: new URLSearchParams(params as Record<string, string>).toString(),
            rootItemId: params.center,
            scale: params.scale,
            expandedItems: params.expandedItems,
            focus: params.focus,
          }}
          enableBackgroundSync={true}
          syncInterval={30000}
          cacheConfig={CACHE_CONFIG}
        />

        <ParentHierarchy
          centerCoordId={centerCoordinate}
          items={{}} // Will get items from cache context
          urlInfo={{
            pathname: `/map`,
            searchParamsString: new URLSearchParams(params as Record<string, string>).toString(),
            rootItemId: params.center,
            scale: params.scale,
            expandedItems: params.expandedItems,
            focus: params.focus,
          }}
        />

        <MapControls
          urlInfo={{
            pathname: `/map`,
            searchParamsString: new URLSearchParams(params as Record<string, string>).toString(),
            rootItemId: params.center,
            scale: params.scale,
            expandedItems: params.expandedItems,
            focus: params.focus,
          }}
          expandedItemIds={params.expandedItems?.split(",") ?? []}
          minimapItemsData={{}} // Will get items from cache context
          currentMapCenterCoordId={centerCoordinate}
          cacheStatus={{
            isLoading: false, // Cache will manage its own loading state
            lastUpdated: Date.now(),
            error: null,
            itemCount: 0,
          }}
        />
            </MapCacheProvider>
            
            <Toolbox />
            <OfflineIndicator isOffline={isOffline} />
          </MapContent>
        </ToolStateManager>
      </TileActionsProvider>
    </div>
  );
}