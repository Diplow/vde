import { useState, useEffect } from "react";

// Define the action mode type
export type ActionMode =
  | "select"
  | "expand"
  | "deepExpand"
  | "edit"
  | "delete"
  | "lock";

// localStorage key for interaction mode
export const INTERACTION_MODE_KEY = "mapPanel.interactionMode";

export type InteractionModeArgs = {
  mapItems: Record<string, any>;
  actions: {
    selection: {
      select: (coord: string) => void;
    };
    mutations: {
      setTileToMutate: (coord: string) => void;
      deleteItem: (params: { itemId: string }) => void;
    };
  };
  initialMode?: ActionMode;
  updateInteractionMode?: (mode: ActionMode) => void;
};

export const useInteractionMode = ({
  mapItems,
  actions,
  initialMode,
}: InteractionModeArgs) => {
  // Use initialMode from parent (which comes from localStorage) or fall back to default
  const [interactionMode, setInternalMode] = useState<ActionMode>(
    initialMode || "select",
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Apply initial mode when it changes
  useEffect(() => {
    if (initialMode) {
      setInternalMode(initialMode);
    }
  }, [initialMode]);

  // Handle mode changes
  const handleModeChange = (mode: ActionMode) => {
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(INTERACTION_MODE_KEY, mode);
    }

    setInternalMode(mode);

    // Additional logic based on the selected mode
    if (mode === "lock") {
      // Implement lock functionality
      console.log("Map locked for editing");
    }
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete && mapItems[itemToDelete]) {
      actions.mutations.deleteItem({
        itemId: mapItems[itemToDelete].metadata.coordId,
      });
    }
    setItemToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleTileClick = (coord: string) => {
    // Always use internal state for the current mode
    const currentMode = interactionMode;
    const item = mapItems[coord];

    switch (currentMode) {
      case "select":
        actions.selection.select(coord);
        break;
      case "expand":
        break;
      case "deepExpand":
        break;
      case "edit":
        // Set the tile to mutate
        actions.mutations.setTileToMutate(coord);
        break;
      case "delete":
        // Show delete confirmation dialog
        if (mapItems[coord]) {
          setItemToDelete(coord);
          setDeleteDialogOpen(true);
        }
        break;
      case "lock":
        // Do nothing in lock mode
        break;
    }
  };

  return {
    data: {
      interactionMode,
      deleteDialogOpen,
      itemToDelete,
    },
    actions: {
      handleModeChange,
      handleDeleteConfirm,
      handleDeleteCancel,
      handleTileClick,
    },
  };
};
