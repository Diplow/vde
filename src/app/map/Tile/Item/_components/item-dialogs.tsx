"use client";

import { lazy, Suspense } from "react";
import type { TileData } from "~/app/map/types/tile-data";
import type { ItemDialogState } from "../_hooks/use-item-dialogs";

// Lazy load the modals
const UpdateItemDialog = lazy(() =>
  import("~/app/map/Dialogs/update-item").then((module) => ({
    default: module.UpdateItemDialog,
  })),
);

const DeleteItemDialog = lazy(() =>
  import("~/app/map/Dialogs/delete-item").then((module) => ({
    default: module.DeleteItemDialog,
  })),
);

interface ItemDialogsProps {
  item: TileData;
  dialogState: ItemDialogState;
}

/**
 * Renders the edit and delete dialogs for a tile item
 * Uses lazy loading and suspense boundaries for performance
 * 
 * @param item - The tile data to edit/delete
 * @param dialogState - The dialog state from useItemDialogs hook
 */
export function ItemDialogs({ item, dialogState }: ItemDialogsProps) {
  return (
    <>
      {dialogState.showUpdateDialog && (
        <Suspense fallback={null}>
          <UpdateItemDialog
            isOpen={dialogState.showUpdateDialog}
            onClose={dialogState.closeUpdateDialog}
            item={item}
          />
        </Suspense>
      )}

      {dialogState.showDeleteDialog && (
        <Suspense fallback={null}>
          <DeleteItemDialog
            isOpen={dialogState.showDeleteDialog}
            onClose={dialogState.closeDeleteDialog}
            item={item}
          />
        </Suspense>
      )}
    </>
  );
}