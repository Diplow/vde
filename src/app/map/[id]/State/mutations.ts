import { useState, useCallback } from "react";
import { api } from "~/commons/trpc/react";
import {
  HexCoord,
  HexCoordSystem,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import type { MapItemAPIContract } from "~/server/api/types/contracts";
import { adapt, HexTileData } from "./types";

export function useMutations({
  mapId,
  itemsById,
  selection,
  setSelection,
  updateItemExpansion,
  stateHelpers,
}: {
  mapId: string;
  itemsById: Record<string, HexTileData>;
  selection: string | null;
  setSelection: React.Dispatch<React.SetStateAction<string | null>>;
  updateItemExpansion: (coordId: string, isExpanded: boolean) => void;
  stateHelpers: {
    addSingleItem: (item: HexTileData) => void;
    updateSingleItem: (coordId: string, newItem: HexTileData) => void;
    deleteSingleItem: (coordId: string) => void;
  };
}) {
  const utils = api.useUtils();
  // Mutation states
  const [tileToMutate, setTileToMutate] = useState<string | null>(null);
  const [itemIsCreating, setItemIsCreating] = useState(false);
  const [itemCreationError, setItemCreationError] = useState<string | null>(
    null,
  );
  const [itemIsRemoving, setItemIsRemoving] = useState(false);
  const [itemRemovingError, setItemRemovingError] = useState<string | null>(
    null,
  );
  const [itemIsUpdating, setItemIsUpdating] = useState(false);
  const [itemUpdateError, setItemUpdateError] = useState<string | null>(null);
  const [itemIsMoving, setItemIsMoving] = useState(false);
  const [itemMovingError, setItemMovingError] = useState<string | null>(null);

  // Item Creation Mutation
  const addItemMutation = api.map.addItem.useMutation({
    onMutate: async (newItemInput) => {
      setItemIsCreating(true);
      setItemCreationError(null);

      const newItemId = HexCoordSystem.createId(newItemInput.coords);
      const parentId = HexCoordSystem.getParentCoordFromId(newItemId);
      const parent = parentId ? itemsById[parentId] : undefined;

      const tempId = `temp-${Date.now()}`;
      const optimisticItem: MapItemAPIContract = {
        id: tempId,
        mapId: mapId,
        coordinates: HexCoordSystem.createId(newItemInput.coords),
        name: newItemInput.title ?? "New Item",
        descr: newItemInput.descr ?? "",
        depth: 0,
        color: parent?.data.color ?? "",
        url: newItemInput.url ?? "",
        neighbors: HexCoordSystem.getChildCoordsFromId(newItemId),
        parentId: parent?.metadata.dbId ?? "",
      };

      const adaptedItem = adapt(optimisticItem);
      stateHelpers.addSingleItem(adaptedItem);
      return { createdItem: adaptedItem };
    },
    onError: (err, _, context) => {
      setItemCreationError(err.message);
      if (context?.createdItem) {
        stateHelpers.deleteSingleItem(context.createdItem.metadata.coordId);
      }
    },
    onSuccess: (data) => {
      stateHelpers.addSingleItem(adapt(data));
    },
    onSettled: () => {
      setItemIsCreating(false);
    },
  });

  // Item Removal Mutation
  const removeItemMutation = api.map.removeItem.useMutation({
    onMutate: async (itemToRemove) => {
      setItemIsRemoving(true);
      setItemRemovingError(null);

      stateHelpers.deleteSingleItem(itemToRemove.itemId);
      if (selection === itemToRemove.itemId) {
        setSelection(null);
      }

      return { deletedItem: itemsById[itemToRemove.itemId] };
    },
    onError: (err, _, context) => {
      setItemRemovingError(err.message);
      if (context?.deletedItem) {
        stateHelpers.addSingleItem(context.deletedItem);
      }
    },
    onSuccess: () => {},
    onSettled: () => {
      setItemIsRemoving(false);
    },
  });

  // Item Update Mutation
  const updateItemMutation = api.map.updateItem.useMutation({
    onMutate: async (itemToUpdate) => {
      setItemIsUpdating(true);
      setItemUpdateError(null);

      const itemToUpdateOriginal = itemsById[
        itemToUpdate.itemId
      ] as HexTileData;
      const newItemData = {
        ...itemToUpdateOriginal,
        data: {
          ...itemToUpdateOriginal.data,
          ...itemToUpdate.data,
          name: itemToUpdate.data.title ?? "",
          description: itemToUpdate.data.descr ?? "",
        },
      };
      console.log("newItemData", newItemData);
      stateHelpers.updateSingleItem(itemToUpdate.itemId, newItemData);

      return { itemToUpdateOriginal };
    },
    onError: (err, updatedItem, context) => {
      setItemUpdateError(err.message);
      if (context?.itemToUpdateOriginal) {
        stateHelpers.updateSingleItem(
          updatedItem.itemId,
          context.itemToUpdateOriginal,
        );
      }
    },
    onSettled: () => {
      setItemIsUpdating(false);
    },
  });

  // Item Move Mutation
  const moveItemMutation = api.map.moveMapItem.useMutation({
    onMutate: async (moveItemInput) => {
      setItemIsMoving(true);
      setItemMovingError(null);

      // Optimistically update the UI
      // Find the items being moved
      const oldCoordsStr = HexCoordSystem.createId(moveItemInput.oldCoords);
      const newCoordsStr = HexCoordSystem.createId(moveItemInput.newCoords);

      const previousItems = {
        sourceItem: itemsById[oldCoordsStr],
        targetItem: itemsById[newCoordsStr],
      };

      if (previousItems.sourceItem) {
        stateHelpers.updateSingleItem(newCoordsStr, {
          ...previousItems.sourceItem,
          metadata: {
            ...previousItems.sourceItem.metadata,
            coordId: newCoordsStr,
            parentId: HexCoordSystem.getParentCoordFromId(newCoordsStr),
          },
          state: {
            ...previousItems.sourceItem.state,
            isDragged: false,
            isDragOver: false,
          },
        });
        stateHelpers.deleteSingleItem(oldCoordsStr);
        updateItemExpansion(newCoordsStr, false);
      }

      if (previousItems.targetItem) {
        stateHelpers.updateSingleItem(oldCoordsStr, {
          ...previousItems.targetItem,
          metadata: {
            ...previousItems.targetItem.metadata,
            coordId: oldCoordsStr,
            parentId: HexCoordSystem.getParentCoordFromId(oldCoordsStr),
          },
          state: {
            ...previousItems.targetItem.state,
            isDragged: false,
            isDragOver: false,
          },
        });
        updateItemExpansion(oldCoordsStr, false);
      }

      return { previousItems };
    },
    onError: (err, newItem, context) => {
      setItemMovingError(err.message);
      // Rollback to the previous value if mutation fails
      if (context?.previousItems) {
        if (context.previousItems.sourceItem) {
          stateHelpers.updateSingleItem(
            context.previousItems.sourceItem.metadata.coordId,
            context.previousItems.sourceItem,
          );
        }
        if (context.previousItems.targetItem) {
          stateHelpers.updateSingleItem(
            context.previousItems.targetItem.metadata.coordId,
            context.previousItems.targetItem,
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      // Reload descendants of the moved items when operation is successful
      const oldCoordsStr = HexCoordSystem.createId(variables.oldCoords);
      const newCoordsStr = HexCoordSystem.createId(variables.newCoords);
      reloadDescendants(oldCoordsStr);
      reloadDescendants(newCoordsStr);
    },
    onSettled: () => {
      setItemIsMoving(false);
    },
  });

  /**
   * Reloads all descendants of an item
   * @param coordId The coordinate ID of the item whose descendants should be reloaded
   */
  const reloadDescendants = useCallback(
    async (coordId: string) => {
      try {
        // Fetch the descendants using the new API endpoint
        const descendants = await utils.map.getDescendants.fetch({
          mapId,
          itemId: coordId,
        });

        // Update each descendant in the state
        descendants.forEach((item) => {
          const adaptedItem = adapt(item);
          stateHelpers.updateSingleItem(item.coordinates, adaptedItem);
        });
      } catch (error) {
        console.error(`Failed to reload descendants for ${coordId}:`, error);
      }
    },
    [mapId, utils.map.getDescendants, stateHelpers],
  );

  // Callback for creating an item
  const createItem = useCallback(
    (input: {
      coords: HexCoord;
      title: string;
      descr: string;
      url: string;
    }) => {
      addItemMutation.mutate({
        centerId: mapId, // Assuming centerId is the mapId based on API router
        coords: input.coords,
        title: input.title,
        descr: input.descr,
        url: input.url,
      });
    },
    [addItemMutation, mapId],
  );

  // Callback for deleting an item
  const deleteItem = useCallback(
    (input: { itemId: string }) => {
      removeItemMutation.mutate({
        itemId: input.itemId,
        mapId: mapId,
      });
    },
    [removeItemMutation, mapId],
  );

  // Callback for updating an item
  const updateItem = useCallback(
    (input: {
      itemId: string;
      data: { title?: string; descr?: string; url?: string };
    }) => {
      updateItemMutation.mutate({
        itemId: input.itemId,
        mapId: mapId,
        data: input.data,
      });
    },
    [updateItemMutation, mapId],
  );

  // Callback for moving an item
  const moveItem = useCallback(
    (input: { sourceCoord: string; targetCoord: string }) => {
      const sourceCoords = HexCoordSystem.parseId(input.sourceCoord);
      const targetCoords = HexCoordSystem.parseId(input.targetCoord);

      moveItemMutation.mutate({
        mapId: mapId,
        oldCoords: sourceCoords,
        newCoords: targetCoords,
      });
    },
    [moveItemMutation, mapId],
  );

  return {
    lifeCycle: {
      itemIsCreating,
      itemCreationError,
      itemIsRemoving,
      itemRemovingError,
      itemIsUpdating,
      itemUpdateError,
      itemIsMoving,
      itemMovingError,
    },
    data: {
      tileToMutate,
    },
    actions: {
      createItem,
      deleteItem,
      updateItem,
      moveItem,
      setTileToMutate,
    },
  };
}

export type MutationsState = ReturnType<typeof useMutations>;
