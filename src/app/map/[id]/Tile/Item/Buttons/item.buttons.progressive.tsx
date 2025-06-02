"use client";

import { Suspense, lazy, useState, useEffect } from "react";
import type { HexTileData } from "../../../State/types";
import type { TileScale } from "../../Base/base.static";
import type { URLInfo } from "../../../types/url-info";
import { TileButtons as StaticTileButtons } from "./item.buttons.static";

// Lazy load the dynamic component
const DynamicTileButtons = lazy(() =>
  import("./item.buttons.dynamic").then((module) => ({
    default: module.DynamicTileButtons,
  })),
);

interface TileButtonsProps {
  item: HexTileData;
  displayConfig: {
    scale?: TileScale;
    isCenter?: boolean;
  };
  expansionState: {
    allExpandedItemIds: string[];
    hasChildren: boolean;
  };
  urlInfo: URLInfo;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Error boundary component for catching dynamic component errors
function TileButtonsErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const [state, setState] = useState<ErrorBoundaryState>({ hasError: false });

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setState({ hasError: true, error: new Error(error.message) });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setState({ hasError: true, error: new Error(event.reason) });
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

  if (state.hasError) {
    console.warn(
      "TileButtons: Falling back to static version due to error:",
      state.error,
    );
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export const ProgressiveTileButtons = (props: TileButtonsProps) => {
  const [shouldUseDynamic, setShouldUseDynamic] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Feature detection
  useEffect(() => {
    setIsHydrated(true);

    // Check if we have the necessary APIs for dynamic functionality
    const hasRequiredAPIs =
      typeof window !== "undefined" &&
      typeof window.history !== "undefined" &&
      typeof window.fetch !== "undefined";

    if (!hasRequiredAPIs) {
      setShouldUseDynamic(false);
    }
  }, []);

  // Static fallback component
  const StaticFallback = () => <StaticTileButtons {...props} />;

  // If not hydrated yet or dynamic features are not available, use static
  if (!isHydrated || !shouldUseDynamic) {
    return <StaticFallback />;
  }

  // Progressive enhancement: try dynamic, fallback to static
  return (
    <TileButtonsErrorBoundary fallback={<StaticFallback />}>
      <Suspense fallback={<StaticFallback />}>
        <DynamicTileButtons {...props} />
      </Suspense>
    </TileButtonsErrorBoundary>
  );
};

// Export both for flexibility
export { ProgressiveTileButtons as TileButtons };
export type { TileButtonsProps };
