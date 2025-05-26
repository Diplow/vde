import { useState, useCallback } from "react";
import { api } from "~/commons/trpc/react";
import {
  CoordSystem,
  type HexCoord,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import { MapItemType } from "~/lib/domains/mapping/_objects/map-item";
import type { MapItemAPIContract } from "~/server/api/types/contracts";
import { adapt, type HexTileData } from "./types";

interface MutationsConfig {
  mapContext: {
    rootItemId: number;
    userId: number;
    groupId: number;
  };
  stateData: {
    itemsById: Record<string, HexTileData>;
  };
  stateActions: {
    updateItemExpansion: (coordId: string, isExpanded: boolean) => void;
    stateHelpers: {
      addSingleItem: (item: HexTileData) => void;
      updateSingleItem: (coordId: string, newItem: HexTileData) => void;
      deleteSingleItem: (coordId: string) => void;
    };
  };
}

export function useMutations({
  mapContext,
  stateData,
  stateActions,
}: MutationsConfig) {
  const { rootItemId, userId, groupId } = mapContext;
  const { itemsById } = stateData;
  const { updateItemExpansion, stateHelpers } = stateActions;
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

      const newItemId = CoordSystem.createId(newItemInput.coords);
      const parentId = CoordSystem.getParentCoordFromId(newItemId);
      const parent = parentId ? itemsById[parentId] : undefined;

      const tempId = `temp-${Date.now()}`;
      const optimisticItem: MapItemAPIContract = {
        id: tempId,
        coordinates: CoordSystem.createId(newItemInput.coords),
        name: newItemInput.title ?? "New Item",
        descr: newItemInput.descr ?? "",
        depth: newItemInput.coords.path.length,
        url: newItemInput.url ?? "",
        parentId: parent?.metadata.dbId ?? null,
        itemType: MapItemType.BASE,
        ownerId: userId.toString(),
      };

      const adaptedItem = adapt(optimisticItem);
      stateHelpers.addSingleItem(adaptedItem);
      return { createdItem: adaptedItem };
    },
    onError: (err, _, context) => {
      setItemCreationError((err as any).message);
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
    onMutate: async (itemToRemove: { coords: HexCoord }) => {
      setItemIsRemoving(true);
      setItemRemovingError(null);

      const coordId = CoordSystem.createId(itemToRemove.coords);
      const item = itemsById[coordId];
      if (item) {
        stateHelpers.deleteSingleItem(coordId);
      }

      return { deletedItem: item };
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
    onMutate: async (itemToUpdate: {
      coords: HexCoord;
      data: { title?: string; descr?: string; url?: string };
    }) => {
      setItemIsUpdating(true);
      setItemUpdateError(null);

      const coordId = CoordSystem.createId(itemToUpdate.coords);
      const itemToUpdateOriginal = itemsById[coordId]!;
      const newItemData = {
        ...itemToUpdateOriginal,
        data: {
          ...itemToUpdateOriginal.data,
          name: itemToUpdate.data.title ?? itemToUpdateOriginal.data.name,
          description:
            itemToUpdate.data.descr ?? itemToUpdateOriginal.data.description,
          url: itemToUpdate.data.url ?? itemToUpdateOriginal.data.url,
        },
      };
      stateHelpers.updateSingleItem(coordId, newItemData);

      return { itemToUpdateOriginal };
    },
    onError: (err, updatedItem, context) => {
      setItemUpdateError(err.message);
      if (context?.itemToUpdateOriginal) {
        const coordId = CoordSystem.createId(updatedItem.coords);
        stateHelpers.updateSingleItem(coordId, context.itemToUpdateOriginal);
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
      const oldCoordsStr = CoordSystem.createId(moveItemInput.oldCoords);
      const newCoordsStr = CoordSystem.createId(moveItemInput.newCoords);

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
            parentId: CoordSystem.getParentCoordFromId(newCoordsStr),
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
            parentId: CoordSystem.getParentCoordFromId(oldCoordsStr),
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
    onSettled: () => {
      setItemIsMoving(false);
    },
  });

  /**
   * Reloads all descendants of an item
   * @param itemId The database ID of the item whose descendants should be reloaded
   */
  const reloadDescendants = useCallback(
    async (itemId: string) => {
      try {
        // Fetch the descendants using the new API endpoint
        const descendants = await utils.map.getDescendants.fetch({
          itemId: parseInt(itemId),
        });

        // Update each descendant in the state
        descendants.forEach((item: MapItemAPIContract) => {
          const adaptedItem = adapt(item);
          stateHelpers.updateSingleItem(item.coordinates, adaptedItem);
        });
      } catch (error) {
        console.error(`Failed to reload descendants for ${itemId}:`, error);
      }
    },
    [utils.map.getDescendants, stateHelpers],
  );

  // Callback for creating an item
  const createItem = useCallback(
    (input: {
      coords: HexCoord;
      parentId: number;
      title: string;
      descr: string;
      url: string;
    }) => {
      addItemMutation.mutate({
        coords: input.coords,
        parentId: input.parentId,
        title: input.title,
        descr: input.descr,
        url: input.url,
      });
    },
    [addItemMutation],
  );

  // Callback for deleting an item
  const deleteItem = useCallback(
    (input: { coordId: string }) => {
      const item = itemsById[input.coordId];
      if (item) {
        removeItemMutation.mutate({
          coords: item.metadata.coordinates,
        });
      }
    },
    [removeItemMutation, itemsById],
  );

  // Callback for updating an item
  const updateItem = useCallback(
    (input: {
      coordId: string;
      data: { title?: string; descr?: string; url?: string };
    }) => {
      const item = itemsById[input.coordId];
      if (item) {
        updateItemMutation.mutate({
          coords: item.metadata.coordinates,
          data: input.data,
        });
      }
    },
    [updateItemMutation, itemsById],
  );

  // Callback for moving an item
  const moveItem = useCallback(
    (input: { sourceCoord: string; targetCoord: string }) => {
      const sourceCoords = CoordSystem.parseId(input.sourceCoord);
      const targetCoords = CoordSystem.parseId(input.targetCoord);

      moveItemMutation.mutate({
        oldCoords: sourceCoords,
        newCoords: targetCoords,
      });
    },
    [moveItemMutation],
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
