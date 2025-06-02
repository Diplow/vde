import type { MapItemAPIContract } from "~/server/api/types/contracts";
import { useInit } from "./init";
import { useMutations } from "./mutations";
import type { HexTileData } from "./types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

export const useMapCanvasState = (
  center: MapItemAPIContract,
  items: Record<string, HexTileData>,
) => {
  const {
    data: { items: itemsById },
    lifeCycle,
    actions: initActions,
  } = useInit({
    items,
  });

  // Extract userId and groupId from center coordinates
  const centerCoords = CoordSystem.parseId(center.coordinates);

  const {
    lifeCycle: mutationsLifeCycle,
    data: mutationsData,
    actions: mutations,
  } = useMutations({
    mapContext: {
      rootItemId: parseInt(center.id),
      userId: centerCoords.userId,
      groupId: centerCoords.groupId,
    },
    stateData: {
      itemsById,
    },
    stateActions: {
      updateItemExpansion: initActions.updateItemExpansion,
      stateHelpers: {
        addSingleItem: initActions.addSingleItem,
        updateSingleItem: initActions.updateSingleItem,
        deleteSingleItem: initActions.deleteSingleItem,
      },
    },
  });

  return {
    lifeCycle: {
      ...lifeCycle,
      mutations: mutationsLifeCycle,
    },
    data: {
      mapItems: items,
      mutations: mutationsData,
    },
    actions: {
      mutations: mutations,
    },
  };
};

export type MapCanvasState = ReturnType<typeof useMapCanvasState>;
