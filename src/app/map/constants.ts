import { HexDirection } from "~/lib/domains/mapping/utils/hex-coordinates";

// Map-related constants used across components

// Default colors for map items - maps each hex direction to a Tailwind color name
export const DEFAULT_MAP_COLORS: Record<HexDirection, string> = {
  [HexDirection.Center]: "zinc",
  [HexDirection.NorthWest]: "amber",
  [HexDirection.NorthEast]: "green",
  [HexDirection.East]: "cyan",
  [HexDirection.SouthEast]: "indigo",
  [HexDirection.SouthWest]: "purple",
  [HexDirection.West]: "rose",
} as const;

// Hierarchy tile sizing constants
export const HIERARCHY_TILE_BASE_SIZE = 60;
export const HIERARCHY_TILE_SCALE = 1;
