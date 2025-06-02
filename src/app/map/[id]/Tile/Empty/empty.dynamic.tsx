"use client";

import { useState, Suspense, lazy, useContext } from "react";
import { StaticEmptyTile } from "./empty.static";
import { CreateItemModal } from "../../Dialogs/create-item.modal";
import { TileActionsContext } from "../../Canvas/index.dynamic";
import { useMapCache } from "../../Cache/map-cache";
import type { TileScale } from "../Base/base.static";
import type { URLInfo } from "../../types/url-info";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

// Lazy load the dynamic dialog for Phase 3 enhancement
const DynamicCreateItemDialog = lazy(() =>
  import("../../Dialogs/create-item.dynamic").then((module) => ({
    default: module.DynamicCreateItemDialog,
  })),
);

interface DynamicEmptyTileProps {
  coordId: string;
  scale?: TileScale;
  baseHexSize?: number;
  urlInfo: URLInfo;
  parentItem?: { id: string; name: string };
  interactive?: boolean;
  currentUserId?: number;
}

export function DynamicEmptyTile(props: DynamicEmptyTileProps) {
  const [showModal, setShowModal] = useState(false);
  const [useDynamicDialog, setUseDynamicDialog] = useState(true);

  // Safely check if we're within a DynamicMapCanvas context
  const tileActions = useContext(TileActionsContext);

  // Always call useMapCache hook - it will throw if not in provider
  let mapCache = null;
  try {
    mapCache = useMapCache();
  } catch {
    // useMapCache will throw if not within MapCacheProvider
    console.log("DynamicEmptyTile: No map cache context");
  }

  // If context is not available, fallback to static behavior
  if (!tileActions) {
    console.log(
      "DynamicEmptyTile: No tile actions context, falling back to static tile",
    );
    return <StaticEmptyTile {...props} />;
  }

  const { onCreateTileRequested } = tileActions;

  // Debug logging
  console.log("DynamicEmptyTile rendered:", {
    coordId: props.coordId,
    showModal,
  });

  // Handle tile click - simplified without interaction modes
  const handleClick = (e: React.MouseEvent) => {
    console.log("DynamicEmptyTile clicked:", {
      coordId: props.coordId,
      event: e.type,
    });

    e.preventDefault();
    e.stopPropagation();

    // Always show create modal when empty tile is clicked
    // but only if user owns this space
    if (props.currentUserId !== undefined) {
      const coord = CoordSystem.parseId(props.coordId);
      if (coord.userId === props.currentUserId) {
        console.log("Triggering create for owned space:", props.coordId);
        onCreateTileRequested?.(props.coordId);
        setShowModal(true);
      } else {
        console.log("Cannot create in space not owned by user");
      }
    } else {
      console.log("User not authenticated for creation");
    }
  };

  // Handle successful creation
  const handleCreateSuccess = () => {
    setShowModal(false);
    // Refresh cache if available (for fallback modal)
    if (mapCache) {
      mapCache.invalidateAll();
    }
    console.log("Item created successfully in dynamic mode");
  };

  // Enhanced empty tile with simplified action integration
  return (
    <>
      <div onClick={handleClick} className="relative cursor-pointer">
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
