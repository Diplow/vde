import { HexDirection } from "~/lib/domains/mapping/utils/hex-coordinates";

// Map-related constants used across components

// Default colors for hexmap items
export const DEFAULT_HEXMAP_COLORS = {
  primary: "#3b82f6",
  secondary: "#64748b",
  accent: "#10b981",
  muted: "#f1f5f9",
} as const;

// Hierarchy tile sizing constants
export const HIERARCHY_TILE_BASE_HEXSIZE = 60;
export const HIERARCHY_TILE_SCALE = 1;
