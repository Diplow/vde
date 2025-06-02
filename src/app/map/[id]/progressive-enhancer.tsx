"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { MapLoadingSkeleton } from "./Canvas/LifeCycle/loading-skeleton";

// Lazy load the dynamic page
const DynamicHexMapPage = lazy(() => import("./page.dynamic"));

interface ProgressiveEnhancerProps {
  mode: "auto" | "dynamic" | "static";
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    scale?: string;
    expandedItems?: string;
    isDynamic?: string;
    focus?: string;
  }>;
  staticFallback: React.ReactNode;
}

interface CapabilityDetection {
  hasJS: boolean;
  hasModernBrowser: boolean;
  isDetectionComplete: boolean;
}

function useCapabilityDetection(): CapabilityDetection {
  const [capabilities, setCapabilities] = useState<CapabilityDetection>({
    hasJS: false,
    hasModernBrowser: false,
    isDetectionComplete: false,
  });

  useEffect(() => {
    // Brief delay to ensure loading state is visible
    const detectionTimer = setTimeout(() => {
      setCapabilities({
        hasJS: true,
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

export function ProgressiveEnhancer({
  mode,
  params,
  searchParams,
  staticFallback,
}: ProgressiveEnhancerProps) {
  const capabilities = useCapabilityDetection();

  // Progressive enhancement decision
  const shouldUseDynamic = () => {
    if (mode === "dynamic") return true;
    // Auto mode: use dynamic if capabilities are available
    return (
      mode === "auto" && capabilities.hasJS && capabilities.hasModernBrowser
    );
  };

  // Show static fallback during capability detection (auto mode only)
  if (mode === "auto" && !capabilities.isDetectionComplete) {
    return <>{staticFallback}</>;
  }

  // Use dynamic version if capabilities support it
  if (shouldUseDynamic()) {
    return (
      <Suspense
        fallback={<MapLoadingSkeleton message="Loading enhanced map..." />}
      >
        <DynamicHexMapPage params={params} searchParams={searchParams} />
      </Suspense>
    );
  }

  // Use static version as fallback
  return <>{staticFallback}</>;
}
