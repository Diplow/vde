"use client";

import React, { Component, type ReactNode } from "react";
import type { HexTileData } from "../../State/types";
import type { URLInfo } from "../../types/url-info";
import { ParentHierarchy as DynamicParentHierarchy } from "./parent-hierarchy.dynamic";
import { ParentHierarchy as StaticParentHierarchy } from "./parent-hierarchy.static";

interface ParentHierarchyProps {
  centerCoordId: string;
  items: Record<string, HexTileData>;
  urlInfo: URLInfo;
}

interface MapCacheErrorBoundaryState {
  hasError: boolean;
  shouldUseStatic: boolean;
}

// Error boundary to catch MapCache-related errors and fallback to static
class MapCacheErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  MapCacheErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false, shouldUseStatic: false };
  }

  static getDerivedStateFromError(): MapCacheErrorBoundaryState {
    return { hasError: true, shouldUseStatic: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.warn("MapCache not available, falling back to static hierarchy:", {
      error: error.message,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Component that attempts to use dynamic hierarchy
const DynamicAttempt = (props: ParentHierarchyProps) => {
  return <DynamicParentHierarchy {...props} />;
};

export const ParentHierarchy = (props: ParentHierarchyProps) => {
  return (
    <MapCacheErrorBoundary fallback={<StaticParentHierarchy {...props} />}>
      <DynamicAttempt {...props} />
    </MapCacheErrorBoundary>
  );
};
