import { useContext } from "react";
import { MapCacheContext } from "../provider";
import type { MapCacheContextValue } from "../types";

/**
 * Advanced hook for accessing internal context (for debugging/testing)
 */
export function useMapCacheContext(): MapCacheContextValue {
  const context = useContext(MapCacheContext);

  if (!context) {
    throw new Error(
      "useMapCacheContext must be used within a MapCacheProvider",
    );
  }

  return context;
}