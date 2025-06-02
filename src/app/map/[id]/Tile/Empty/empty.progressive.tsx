"use client";

import { Suspense, lazy, Component, type ReactNode } from "react";
import { StaticEmptyTile } from "./empty.static";
import type { TileScale } from "../Base/base.static";
import type { URLInfo } from "../../types/url-info";

// Lazy load enhanced and dynamic versions
const EnhancedEmptyTile = lazy(() =>
  import("./empty.enhanced").then((module) => ({
    default: module.EnhancedEmptyTile,
  })),
);

const DynamicEmptyTile = lazy(() =>
  import("./empty.dynamic").then((module) => ({
    default: module.DynamicEmptyTile,
  })),
);

interface EmptyTileProps {
  coordId: string;
  scale?: TileScale;
  baseHexSize?: number;
  urlInfo: URLInfo;
  parentItem?: { id: string; name: string };
  interactive?: boolean;
  currentUserId?: number;
}

// Error boundary for graceful degradation
class EmptyTileErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Enhanced empty tile failed, using static fallback:", error);
    console.log("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Component that attempts to use dynamic tile with tile actions context
function DynamicAttempt(props: EmptyTileProps) {
  console.log(
    "ProgressiveEmptyTile: Attempting dynamic version for",
    props.coordId,
  );
  return <DynamicEmptyTile {...props} />;
}

// Component that attempts to use enhanced tile with URL-based create mode
function EnhancedAttempt(props: EmptyTileProps) {
  console.log(
    "ProgressiveEmptyTile: Falling back to enhanced version for",
    props.coordId,
  );
  return <EnhancedEmptyTile {...props} />;
}

export function ProgressiveEmptyTile(props: EmptyTileProps) {
  const StaticFallback = () => <StaticEmptyTile {...props} />;

  return (
    <EmptyTileErrorBoundary fallback={<StaticFallback />}>
      <Suspense fallback={<StaticFallback />}>
        {/* Try dynamic version first (best - uses centralized tile actions) */}
        <EmptyTileErrorBoundary
          fallback={
            <Suspense fallback={<StaticFallback />}>
              {/* Fallback to enhanced version (good - uses URL params) */}
              <EnhancedAttempt {...props} />
            </Suspense>
          }
        >
          <DynamicAttempt {...props} />
        </EmptyTileErrorBoundary>
      </Suspense>
    </EmptyTileErrorBoundary>
  );
}

// Default export for easy importing
export { ProgressiveEmptyTile as EmptyTile };
