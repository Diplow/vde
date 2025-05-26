import { HexDirection } from "~/lib/domains/mapping/utils/hex-coordinates";

// Map-related constants used across components

// Default colors for hexmap items - maps each hex direction to a Tailwind color name
export const DEFAULT_HEXMAP_COLORS: Record<HexDirection, string> = {
  [HexDirection.Center]: "zinc",
  [HexDirection.NorthWest]: "amber",
  [HexDirection.NorthEast]: "emerald",
  [HexDirection.East]: "cyan",
  [HexDirection.SouthEast]: "indigo",
  [HexDirection.SouthWest]: "fuchsia",
  [HexDirection.West]: "rose",
} as const;

// Hierarchy tile sizing constants
export const HIERARCHY_TILE_BASE_HEXSIZE = 60;
export const HIERARCHY_TILE_SCALE = 1;
