import type { MapItemAPIContract } from "~/server/api/types/contracts";
import {
  CoordSystem,
  type HexCoord,
  HexDirection,
} from "~/lib/domains/mapping/utils/hex-coordinates";
// import type { ScaleState } from "./scale"; // Commented out problematic import

// TODO: Move this to a shared constants file
const DEFAULT_HEXMAP_COLORS = {
  [HexDirection.NorthWest]: "amber",
  [HexDirection.NorthEast]: "cyan",
  [HexDirection.East]: "emerald",
  [HexDirection.SouthEast]: "fuchsia",
  [HexDirection.SouthWest]: "indigo",
  [HexDirection.West]: "rose",
  [HexDirection.Center]: "zinc",
};

function getColor(coordinates: HexCoord): string {
  if (coordinates.path.length < 1) {
    return "zinc-50";
  }
  return `${DEFAULT_HEXMAP_COLORS[coordinates.path[0] as HexDirection]}-${
    100 + 100 * coordinates.path.length
  }`;
}

const adapt = (item: MapItemAPIContract) => {
  const coordinates = CoordSystem.parseId(item.coordinates);
  const parentId = CoordSystem.getParentCoord(coordinates);
  return {
    metadata: {
      dbId: item.id,
      coordId: item.coordinates,
      parentId: parentId ? CoordSystem.createId(parentId) : undefined,
      coordinates,
      depth: coordinates.path.length,
    },
    data: {
      name: item.name,
      description: item.descr,
      url: item.url,
      color: getColor(coordinates),
    },
    state: {
      isDragged: false,
      isHovered: false,
      isSelected: false,
      isExpanded: false,
      isDragOver: false,
      isHovering: false,
    },
  };
};

type HexTileData = ReturnType<typeof adapt>;

export { adapt };
export type { /* ScaleState, */ HexTileData }; // Commented out ScaleState from export
