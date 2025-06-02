"use client";

import { useState, useEffect } from "react";
import { DynamicMapCanvas } from "./Canvas/index.dynamic";
import { MapCacheProvider } from "./Cache/map-cache";
import { MapLoadingSkeleton } from "./Canvas/LifeCycle/loading-skeleton";
import { MapErrorBoundary } from "./Canvas/LifeCycle/error-boundary";
import { adapt, type HexTileData } from "./State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { type URLInfo } from "./types/url-info";
import { api } from "~/commons/trpc/react";
import { ParentHierarchy } from "./Controls/ParentHierarchy/parent-hierarchy.progressive";
import { MapControls } from "./Controls";

interface DynamicHexMapPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    scale?: string;
    expandedItems?: string;
    focus?: string;
  }>;
}

interface MapData {
  centerInfo: {
    center: string;
    rootItemId: number;
    userId: number;
    groupId: number;
  } | null;
  items: Record<string, HexTileData>;
  scale: number;
  expandedItemIds: string[];
  isLoading: boolean;
  error: Error | null;
}

export default function DynamicHexMapPage({
  params,
  searchParams,
}: DynamicHexMapPageProps) {
  const [urlInfo, setUrlInfo] = useState<URLInfo | null>(null);
  const [mapData, setMapData] = useState<MapData>({
    centerInfo: null,
    items: {},
    scale: 3,
    expandedItemIds: [],
    isLoading: true,
    error: null,
  });

  const utils = api.useUtils();

  // Initialize URL info from params
  useEffect(() => {
    async function initializeUrlInfo() {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;

      const info: URLInfo = {
        pathname: `/map/${resolvedParams.id}`,
        searchParamsString: new URLSearchParams(
          resolvedSearchParams as any,
        ).toString(),
        rootItemId: resolvedParams.id,
        scale: resolvedSearchParams.scale,
        expandedItems: resolvedSearchParams.expandedItems,
        focus: resolvedSearchParams.focus,
      };

      setUrlInfo(info);
    }

    initializeUrlInfo();
  }, [params, searchParams]);

  // Fetch map data when URL info is ready
  useEffect(() => {
    if (!urlInfo) return;

    async function fetchMapData() {
      try {
        setMapData((prev) => ({ ...prev, isLoading: true, error: null }));

        // Fetch root item - urlInfo is guaranteed to be non-null here
        const rootItem = await utils.map.getRootItemById.fetch({
          mapItemId: parseInt(urlInfo!.rootItemId),
        });

        // Handle initial focus parameter - default to root item coordinates
        if (!urlInfo!.focus) {
          const defaultFocus = rootItem.coordinates;
          const currentPath = `/map/${urlInfo!.rootItemId}`;
          const newSearchParams = new URLSearchParams(
            urlInfo!.searchParamsString,
          );
          newSearchParams.set("focus", defaultFocus);
          window.history.replaceState(
            null,
            "",
            `${currentPath}?${newSearchParams.toString()}`,
          );
        }

        // Extract userId and groupId from root item coordinates
        const rootCoords = CoordSystem.parseId(rootItem.coordinates);

        // Fetch all items
        const items = await utils.map.getItemsForRootItem.fetch({
          userId: rootCoords.userId,
          groupId: rootCoords.groupId,
        });

        // Process data
        const expandedItemIdsFromUrl = urlInfo!.expandedItems
          ? urlInfo!.expandedItems.split(",")
          : [];

        const processedItems = items
          .map(adapt)
          .filter((item) => !item.metadata.coordinates.path.includes(0))
          .reduce(
            (acc, item) => {
              acc[item.metadata.coordId] = item;
              return acc;
            },
            {} as Record<string, HexTileData>,
          );

        const centerInfo = {
          center: rootItem.coordinates,
          rootItemId: parseInt(urlInfo!.rootItemId),
          userId: rootCoords.userId,
          groupId: rootCoords.groupId,
        };

        setMapData({
          centerInfo,
          items: processedItems,
          scale: urlInfo!.scale ? parseInt(urlInfo!.scale) : 3,
          expandedItemIds: items
            .filter((item) => expandedItemIdsFromUrl.includes(item.id))
            .map((item) => item.id),
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error loading map data:", error);
        setMapData((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    }

    fetchMapData();
  }, [urlInfo, utils]);

  // Show loading while URL info isn't ready
  if (!urlInfo) {
    return <MapLoadingSkeleton message="Initializing..." />;
  }

  // Show loading while fetching data
  if (mapData.isLoading) {
    return <MapLoadingSkeleton message="Loading map data..." />;
  }

  // Handle data fetch errors
  if (mapData.error || !mapData.centerInfo) {
    return (
      <MapErrorBoundary
        error={mapData.error || new Error("Failed to load map data")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Client-side rendered dynamic map with cache provider
  return (
    <div className="relative flex h-full w-full flex-col">
      <MapCacheProvider
        initialItems={mapData.items}
        initialCenter={mapData.centerInfo.center}
        initialExpandedItems={mapData.expandedItemIds}
        cacheConfig={{
          maxAge: 300000, // 5 minutes
          backgroundRefreshInterval: 30000, // 30 seconds
          enableOptimisticUpdates: true,
          maxDepth: 3, // Hierarchical loading depth
        }}
        mapContext={{
          rootItemId: mapData.centerInfo.rootItemId,
          userId: mapData.centerInfo.userId,
          groupId: mapData.centerInfo.groupId,
        }}
      >
        <DynamicMapCanvas
          centerInfo={mapData.centerInfo}
          expandedItemIds={mapData.expandedItemIds}
          urlInfo={urlInfo}
          enableBackgroundSync={true}
          syncInterval={30000}
          fallback={
            <MapLoadingSkeleton message="Loading enhanced features..." />
          }
          errorBoundary={
            <MapErrorBoundary
              error={new Error("Dynamic features failed")}
              onRetry={() => window.location.reload()}
            />
          }
          cacheConfig={{
            maxAge: 300000,
            backgroundRefreshInterval: 30000,
            enableOptimisticUpdates: true,
            maxDepth: 3,
          }}
        />

        {/* Parent Hierarchy */}
        <ParentHierarchy
          centerCoordId={mapData.centerInfo.center}
          items={mapData.items}
          urlInfo={urlInfo}
        />

        {/* Main Controls */}
        <MapControls
          urlInfo={urlInfo}
          expandedItemIds={mapData.expandedItemIds}
          minimapItemsData={mapData.items}
          currentMapCenterCoordId={mapData.centerInfo.center}
          cacheStatus={{
            isLoading: mapData.isLoading,
            lastUpdated: Date.now(), // TODO: Get from cache
            error: mapData.error,
            itemCount: Object.keys(mapData.items).length,
          }}
        />
      </MapCacheProvider>
    </div>
  );
}
