export const MAPPING_ERRORS = {
  // HexMap errors
  INVALID_ID: "Invalid ID: must be a positive number",
  INVALID_MAP_CENTER: "Invalid map center: must be at the origin 0,0",
  MAP_OWNER_ID_REQUIRED: "Map Owner ID is required",
  INVALID_MAP_DEPTH: "Invalid map depth: must be between 0 and 5",

  // MapItem errors
  MUST_GRAVITATE_AROUND_CENTER:
    "MapItems are built to gravitate around a center.",
  INVALID_PARENT_LEVEL: "Invalid parent: must be one level deeper",
  INVALID_NEIGHBORS_COUNT: "Invalid number of neighbors: must be 6 or less",
  INVALID_NEIGHBOR_COLOR:
    "Invalid neighbor: must have the same color as parent",
  INVALID_NEIGHBOR_PATH: "Invalid neighbor: path must extend parent's path",

  // HexMap actions errors
  PARENT_REQUIRED: "Parent should be provided for non-center items",
  FAILED_PARENT_COORDS: "Failed to get parent coords",
  MAP_CENTER_ITEM: "Map item is the center of the map",

  // MoveMapItem errors
  TARGET_LOCATION_OCCUPIED:
    "Target location is already occupied by another item",
  DIFFERENT_PARENT_NOT_ALLOWED:
    "Moving to a location with a different parent is not allowed",
  ITEM_NOT_FOUND: "The item to move was not found at the specified coordinates",
  CENTER_ITEM_NOT_ALLOWED: "Center item is not allowed to be moved",

  // HexCoordinates errors
  INVALID_HEX_ID: "Invalid hex ID",

  // MapItem infrastructure errors
  FAILED_CREATE_MAP_ITEM: "Failed to create map item: No item returned",
  MISSING_REF_OR_COORDS: "Either ref or coords must be provided",
} as const;

export type MappingError = keyof typeof MAPPING_ERRORS;
