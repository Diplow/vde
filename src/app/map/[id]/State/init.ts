import { useCallback, useEffect, useReducer } from "react";
import type { HexTileData } from "./types";
import { itemsReducer } from "./items.reducer";

export function useInit({ items }: { items: Record<string, HexTileData> }) {
  const [itemsById, dispatch] = useReducer(itemsReducer, {});

  useEffect(() => {
    Object.entries(items).forEach(([id, item]) => {
      if (itemsById[id]) {
        dispatch({
          type: "UPDATE_ITEM",
          payload: { coordId: id, item },
        });
      } else {
        dispatch({ type: "ADD_ITEM", payload: { item } });
      }
    });
  }, [items, itemsById]);

  const updateSingleItem = useCallback(
    (coordId: string, newItem: HexTileData) => {
      dispatch({ type: "UPDATE_ITEM", payload: { coordId, item: newItem } });
    },
    [],
  );

  const deleteSingleItem = useCallback((coordId: string) => {
    dispatch({ type: "DELETE_ITEM", payload: { coordId } });
  }, []);

  const addSingleItem = useCallback((item: HexTileData) => {
    dispatch({ type: "ADD_ITEM", payload: { item } });
  }, []);

  const updateItemExpansion = useCallback(
    (coordId: string, isExpanded: boolean) => {
      dispatch({
        type: "UPDATE_ITEM_EXPANSION",
        payload: { coordId, isExpanded },
      });
    },
    [],
  );

  return {
    lifeCycle: {},
    data: {
      items: itemsById,
    },
    actions: {
      addSingleItem,
      deleteSingleItem,
      updateSingleItem,
      updateItemExpansion,
    },
  };
}
