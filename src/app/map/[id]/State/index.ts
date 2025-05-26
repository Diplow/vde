import type { MapItemAPIContract } from "~/server/api/types/contracts";
import { useInit } from "./init";
import { useMutations } from "./mutations";
import type { HexTileData } from "./types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import {
  useInteractionMode,
  type InteractionModeArgs,
  type ActionMode,
  INTERACTION_MODE_KEY,
} from "./interactionMode";
import { useEffect, useState } from "react";

export const useMapCanvasState = (
  center: MapItemAPIContract,
  items: Record<string, HexTileData>,
) => {
  // Get initial interaction mode from localStorage or fallback to "select"
  const [initialInteractionMode, setInitialInteractionMode] =
    useState<ActionMode>("select");

  // Initialize from localStorage on first render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMode = localStorage.getItem(
        INTERACTION_MODE_KEY,
      ) as unknown as ActionMode;
      if (storedMode) {
        setInitialInteractionMode(storedMode);
      }
    }
  }, []);

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

  // Pass only required parts to the interaction hook
  const interactionArgs: InteractionModeArgs = {
    mapItems: itemsById,
    actions: {
      mutations: mutations,
    },
    initialMode: initialInteractionMode,
  };

  // Get interaction state and actions
  const { data: interactionData, actions: interactionActions } =
    useInteractionMode(interactionArgs);

  return {
    lifeCycle: {
      ...lifeCycle,
      mutations: mutationsLifeCycle,
    },
    data: {
      mapItems: items,
      mutations: mutationsData,
      interactions: interactionData,
    },
    actions: {
      mutations: mutations,
      interactions: interactionActions,
    },
  };
};

export type MapCanvasState = ReturnType<typeof useMapCanvasState>;
