"use client";

import { useState } from "react";

export interface ItemDialogState {
  showUpdateDialog: boolean;
  showDeleteDialog: boolean;
  openUpdateDialog: () => void;
  openDeleteDialog: () => void;
  closeUpdateDialog: () => void;
  closeDeleteDialog: () => void;
}

/**
 * Hook to manage the state of item edit/delete dialogs
 * Provides open/close functions and visibility state
 * 
 * @returns Dialog state and control functions
 */
export function useItemDialogs(): ItemDialogState {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return {
    showUpdateDialog,
    showDeleteDialog,
    openUpdateDialog: () => setShowUpdateDialog(true),
    openDeleteDialog: () => setShowDeleteDialog(true),
    closeUpdateDialog: () => setShowUpdateDialog(false),
    closeDeleteDialog: () => setShowDeleteDialog(false),
  };
}