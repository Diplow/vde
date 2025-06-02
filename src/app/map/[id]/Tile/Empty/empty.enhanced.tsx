"use client";

import { useState, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { StaticEmptyTile } from "./empty.static";
import { CreateItemModal } from "../../Dialogs/create-item.modal";
import type { TileScale } from "../Base/base.static";
import type { URLInfo } from "../../types/url-info";

// Lazy load the dynamic dialog for Phase 3 enhancement
const DynamicCreateItemDialog = lazy(() =>
  import("../../Dialogs/create-item.dynamic").then((module) => ({
    default: module.DynamicCreateItemDialog,
  })),
);

interface EnhancedEmptyTileProps {
  coordId: string;
  scale?: TileScale;
  baseHexSize?: number;
  urlInfo: URLInfo;
  parentItem?: { id: string; name: string };
  interactive?: boolean;
  currentUserId?: number;
}

export function EnhancedEmptyTile(props: EnhancedEmptyTileProps) {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [useDynamicDialog, setUseDynamicDialog] = useState(true);
  const isCreateMode = searchParams.get("createMode") === "true";

  // Handle click in create mode
  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isCreateMode) {
      setShowModal(true);
    }
    // If not in create mode, fall through to static link behavior
  };

  // Handle successful creation
  const handleCreateSuccess = () => {
    setShowModal(false);
    // Could add toast notification here
    console.log("Item created successfully in enhanced mode");
  };

  // Handle fallback to Phase 2 modal if dynamic fails
  const handleDynamicDialogError = () => {
    console.warn("Dynamic dialog failed, falling back to Phase 2 modal");
    setUseDynamicDialog(false);
  };

  // Enhanced empty tile with modal overlay
  return (
    <>
      <div onClick={isCreateMode ? handleCreateClick : undefined}>
        <StaticEmptyTile {...props} />
      </div>

      {/* Phase 3: Dynamic dialog with optimistic updates */}
      {showModal && useDynamicDialog && (
        <Suspense
          fallback={
            <CreateItemModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              coordId={props.coordId}
              parentItem={props.parentItem}
              urlInfo={props.urlInfo}
              onSuccess={handleCreateSuccess}
              preventRedirects={true}
            />
          }
        >
          <DynamicCreateItemDialog
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            coordId={props.coordId}
            parentItem={props.parentItem}
            urlInfo={props.urlInfo}
            onSuccess={handleCreateSuccess}
          />
        </Suspense>
      )}

      {/* Phase 2: Fallback modal if dynamic dialog is not available */}
      {showModal && !useDynamicDialog && (
        <CreateItemModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          coordId={props.coordId}
          parentItem={props.parentItem}
          urlInfo={props.urlInfo}
          onSuccess={handleCreateSuccess}
          preventRedirects={true}
        />
      )}
    </>
  );
}
