"use client";

import { Suspense, lazy, useState, useEffect } from "react";
import { StaticMapCanvas, type CenterInfo } from "./index.static";
import { MapCacheProvider } from "../Cache/map-cache";
import type { HexTileData } from "../State/types";
import type { URLInfo } from "../types/url-info";
import { MapLoadingSkeleton } from "./LifeCycle/loading-skeleton";
import { MapErrorBoundary } from "./LifeCycle/error-boundary";

// Lazy load the dynamic canvas
const DynamicMapCanvas = lazy(() =>
  import("./index.dynamic").then((module) => ({
    default: module.DynamicMapCanvas,
  })),
);

interface ProgressiveMapCanvasProps {
  centerInfo: CenterInfo;
  items: Record<string, HexTileData>;
  scale?: number;
  expandedItemIds?: string[];
  urlInfo: URLInfo;

  // Progressive enhancement options
  mode?: "auto" | "static";
  cacheConfig?: {
    maxAge: number;
    backgroundRefreshInterval: number;
    enableOptimisticUpdates: boolean;
    maxDepth: number;
  };
}

interface CapabilityDetection {
  hasJS: boolean;
  hasLocalStorage: boolean;
  hasWebSockets: boolean;
  hasModernBrowser: boolean;
  isDetectionComplete: boolean;
}

function useCapabilityDetection(): CapabilityDetection {
  const [capabilities, setCapabilities] = useState<CapabilityDetection>({
    hasJS: false,
    hasLocalStorage: false,
    hasWebSockets: false,
    hasModernBrowser: false,
    isDetectionComplete: false,
  });

  useEffect(() => {
    const detectionTimer = setTimeout(() => {
      setCapabilities({
        hasJS: true,
        hasLocalStorage: typeof localStorage !== "undefined",
        hasWebSockets: typeof WebSocket !== "undefined",
        hasModernBrowser:
          typeof window !== "undefined" &&
          typeof window.fetch !== "undefined" &&
          typeof window.history !== "undefined" &&
          typeof window.Promise !== "undefined",
        isDetectionComplete: true,
      });
    }, 100);

    return () => clearTimeout(detectionTimer);
  }, []);

  return capabilities;
}

function MapCanvasErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.warn(
        "MapCanvas: Falling back to static version due to error:",
        error.message,
      );
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn(
        "MapCanvas: Falling back to static version due to promise rejection:",
        event.reason,
      );
      setHasError(true);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export const ProgressiveMapCanvas = ({
  centerInfo,
  items,
  scale = 3,
  expandedItemIds = [],
  urlInfo,
  mode = "auto",
  cacheConfig = {
    maxAge: 300000,
    backgroundRefreshInterval: 30000,
    enableOptimisticUpdates: true,
    maxDepth: 3,
  },
}: ProgressiveMapCanvasProps) => {
  const capabilities = useCapabilityDetection();

  // Static fallback component
  const StaticFallback = () => (
    <StaticMapCanvas
      centerInfo={centerInfo}
      items={items}
      scale={scale}
      expandedItemIds={expandedItemIds}
      urlInfo={urlInfo}
    />
  );

  // Handle forced modes for testing/debugging
  if (mode === "static") {
    return <StaticFallback />;
  }

  // Auto mode: Progressive enhancement based on capabilities
  if (!capabilities.isDetectionComplete) {
    return <MapLoadingSkeleton message="Initializing map..." />;
  }

  // Determine if we should use dynamic features after detection
  const shouldUseDynamic =
    mode === "auto" && capabilities.hasJS && capabilities.hasModernBrowser;

  // If dynamic features are not available, use static
  if (!shouldUseDynamic) {
    return <StaticFallback />;
  }

  // Progressive enhancement: try dynamic with cache provider, fallback to static
  return (
    <MapCanvasErrorBoundary fallback={<StaticFallback />}>
      <MapCacheProvider
        initialItems={items}
        initialCenter={centerInfo.center}
        initialExpandedItems={expandedItemIds}
        cacheConfig={cacheConfig}
        mapContext={{
          rootItemId: centerInfo.rootItemId,
          userId: centerInfo.userId,
          groupId: centerInfo.groupId,
        }}
      >
        <Suspense
          fallback={<MapLoadingSkeleton message="Loading enhanced map..." />}
        >
          <DynamicMapCanvas
            centerInfo={centerInfo}
            expandedItemIds={expandedItemIds}
            urlInfo={urlInfo}
            enableBackgroundSync={capabilities.hasWebSockets}
            syncInterval={30000}
            fallback={<StaticFallback />}
            errorBoundary={
              <MapErrorBoundary
                error={new Error("Dynamic features failed")}
                onRetry={() => window.location.reload()}
              />
            }
            cacheConfig={cacheConfig}
          />
        </Suspense>
      </MapCacheProvider>
    </MapCanvasErrorBoundary>
  );
};

export { ProgressiveMapCanvas as MapCanvas };
export type { ProgressiveMapCanvasProps as MapCanvasProps };
