import { MapItemAPIContract } from "~/server/api/types/contracts";
import { useInit } from "./init";
import { useSelection } from "./selection";
import { useMutations } from "./mutations";
import {
  useInteractionMode,
  InteractionModeArgs,
  ActionMode,
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
      ) as ActionMode;
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

  const { selection, setSelection, select } = useSelection();

  const {
    lifeCycle: mutationsLifeCycle,
    data: mutationsData,
    actions: mutations,
  } = useMutations({
    mapId: center.mapId,
    itemsById,
    selection,
    setSelection,
    updateItemExpansion: initActions.updateItemExpansion,
    stateHelpers: {
      addSingleItem: initActions.addSingleItem,
      updateSingleItem: initActions.updateSingleItem,
      deleteSingleItem: initActions.deleteSingleItem,
    },
  });

  // Pass only required parts to the interaction hook
  const interactionArgs: InteractionModeArgs = {
    mapItems: itemsById,
    actions: {
      selection: { select },
      mutations,
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
      selection: { selection },
      mutations: mutationsData,
      interactions: interactionData,
    },
    actions: {
      selection: { select },
      mutations,
      interactions: interactionActions,
    },
  };
};

export type MapCanvasState = ReturnType<typeof useMapCanvasState>;
