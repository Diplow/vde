import type { HexTileData } from "./types";

type ItemsAction =
  | { type: "INIT_ITEMS"; payload: HexTileData[] }
  | { type: "UPDATE_ITEM"; payload: { coordId: string; item: HexTileData } }
  | { type: "DELETE_ITEM"; payload: { coordId: string } }
  | { type: "ADD_ITEM"; payload: { item: HexTileData } }
  | {
      type: "UPDATE_ITEM_EXPANSION";
      payload: { coordId: string; isExpanded: boolean };
    };

export const itemsReducer = (
  state: Record<string, HexTileData>,
  action: ItemsAction,
) => {
  switch (action.type) {
    case "INIT_ITEMS":
      return action.payload.reduce(
        (acc, item) => {
          acc[item.metadata.coordId] = item;
          return acc;
        },
        {} as Record<string, HexTileData>,
      );

    case "UPDATE_ITEM":
      return {
        ...state,
        [action.payload.coordId]: action.payload.item,
      };

    case "DELETE_ITEM":
      const newState = { ...state };
      delete newState[action.payload.coordId];
      return newState;

    case "ADD_ITEM":
      return {
        ...state,
        [action.payload.item.metadata.coordId]: action.payload.item,
      };

    case "UPDATE_ITEM_EXPANSION": {
      const item = state[action.payload.coordId];
      if (!item) return state;
      return {
        ...state,
        [action.payload.coordId]: {
          ...item,
          state: {
            ...item.state,
            isExpanded: action.payload.isExpanded,
          },
        },
      };
    }

    default:
      return state;
  }
};
