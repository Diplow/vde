import type { MapItemAPIContract } from "~/server/api/types/contracts";
import {
  HexCoordSystem,
  type HexCoord,
} from "~/lib/domains/mapping/utils/hex-coordinates";
// import type { ScaleState } from "./scale"; // Commented out problematic import

const adapt = (item: MapItemAPIContract) => {
  const coordinates = HexCoordSystem.parseId(item.coordinates);
  const parentId = HexCoordSystem.getParentCoord(coordinates);
  return {
    metadata: {
      dbId: item.id,
      coordId: item.coordinates,
      parentId: parentId ? HexCoordSystem.createId(parentId) : undefined,
      coordinates,
      depth: coordinates.path.length,
    },
    data: {
      name: item.name,
      description: item.descr,
      url: item.url,
      color: item.color,
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
