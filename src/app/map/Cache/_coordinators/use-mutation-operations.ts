import { useMemo, useRef, useCallback } from "react";
import type { Dispatch } from "react";
import { api } from "~/commons/trpc/react";
import type { CacheState, CacheAction } from "../State/types";
import type { MutationOperations } from "../Handlers/types";
import type { DataOperations } from "../Handlers/types";
import type { StorageService } from "../Services/types";
import { MutationCoordinator } from "./mutation-coordinator";

interface MutationOperationsConfig {
  dispatch: Dispatch<CacheAction>;
  state: CacheState;
  dataOperations: DataOperations;
  storageService: StorageService;
  mapContext?: {
    userId: number;
    groupId: number;
    rootItemId: number;
  };
}

/**
 * Hook that creates mutation operations using the MutationCoordinator
 */
export function useMutationOperations(config: MutationOperationsConfig): MutationOperations {
  // Initialize tRPC mutation hooks
  const addItemMutation = api.map.addItem.useMutation();
  const updateItemMutation = api.map.updateItem.useMutation();
  const deleteItemMutation = api.map.removeItem.useMutation();
  
  // Use ref to provide current state to coordinator
  const stateRef = useRef(config.state);
  stateRef.current = config.state;
  const getState = useCallback(() => ({ itemsById: stateRef.current.itemsById }), []);
  
  // Create coordinator instance
  const coordinator = useMemo(() => {
    return new MutationCoordinator({
      dispatch: config.dispatch,
      getState,
      dataOperations: config.dataOperations,
      storageService: config.storageService,
      mapContext: config.mapContext,
      addItemMutation,
      updateItemMutation,
      deleteItemMutation,
    });
  }, [
    config.dispatch,
    getState,
    config.dataOperations,
    config.storageService,
    config.mapContext,
    addItemMutation,
    updateItemMutation,
    deleteItemMutation,
  ]);
  
  // Return operations interface
  return useMemo(() => ({
    createItem: coordinator.createItem.bind(coordinator),
    updateItem: coordinator.updateItem.bind(coordinator),
    deleteItem: coordinator.deleteItem.bind(coordinator),
    rollbackOptimisticChange: coordinator.rollbackChange.bind(coordinator),
    rollbackAllOptimistic: coordinator.rollbackAll.bind(coordinator),
    getPendingOptimisticChanges: coordinator.getPendingChanges.bind(coordinator),
  }), [coordinator]);
}