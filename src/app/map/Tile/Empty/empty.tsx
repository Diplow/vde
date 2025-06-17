"use client";

import { useState, useContext } from "react";
import { Plus } from "lucide-react";
import { StaticBaseTileLayout, type TileScale } from "~/app/static/map/Tile/Base/base";
import { CreateItemModal } from "../../Dialogs/create-item.modal";
import { DynamicCreateItemDialog } from "../../Dialogs/create-item";
import { TileActionsContext } from "../../Canvas";
import type { URLInfo } from "../../types/url-info";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

interface DynamicEmptyTileProps {
  coordId: string;
  scale?: TileScale;
  baseHexSize?: number;
  urlInfo: URLInfo;
  parentItem?: { id: string; name: string };
  interactive?: boolean;
  currentUserId?: number;
}

function getDropHandlers(
  coordId: string,
  isValidDropTarget: boolean,
  tileActions: React.ContextType<typeof TileActionsContext>
) {
  if (!isValidDropTarget || !tileActions) {
    return {};
  }
  
  return {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      tileActions.dragHandlers.onDragOver(coordId, e);
    },
    onDragLeave: tileActions.dragHandlers.onDragLeave,
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      tileActions.dragHandlers.onDrop(coordId, e);
    },
  };
}

export function DynamicEmptyTile(props: DynamicEmptyTileProps) {
  const [showModal, setShowModal] = useState(false);
  const [useDynamicDialog] = useState(true);

  // Safely check if we're within a DynamicMapCanvas context
  const tileActions = useContext(TileActionsContext);


  // If context is not available, we'll still render but without the context actions
  const onCreateTileRequested = tileActions?.onCreateTileRequested;
  
  // Check if this tile is a valid drop target
  const isValidDropTarget = tileActions?.isValidDropTarget(props.coordId) === true;
  const isDropTargetActive = tileActions?.isDropTarget(props.coordId) === true;


  // Handle create button click
  const handleCreateClick = (e: React.MouseEvent) => {

    // Prevent any bubbling
    e.preventDefault();
    e.stopPropagation();

    // Show create modal
    onCreateTileRequested?.(props.coordId);
    setShowModal(true);
  };

  // Handle successful creation
  const handleCreateSuccess = () => {
    setShowModal(false);
    // Don't invalidate the cache - the optimistic update handles everything
  };

  // Enhanced empty tile with simplified action integration
  const coord = CoordSystem.parseId(props.coordId);
  const userOwnsThisSpace =
    props.currentUserId !== undefined && coord.userId === props.currentUserId;
  
  // Get drop handlers using helper function
  const dropProps = getDropHandlers(props.coordId, isValidDropTarget, tileActions);

  return (
    <>
      <div 
        className={`group relative hover:z-10`} 
        data-testid={`empty-tile-${props.coordId}`}
        {...dropProps}>
        {/* Invisible hover area overlay to ensure full tile responds to hover */}
        <div className="pointer-events-auto absolute inset-0 z-10" />

        <StaticBaseTileLayout
          coordId={props.coordId}
          scale={props.scale ?? 1}
          color={{ color: isDropTargetActive ? "zinc" : "zinc", tint: isDropTargetActive ? "300" : "100" }}
          stroke={{ color: "zinc-950", width: 1 }}
          cursor="cursor-pointer"
          baseHexSize={props.baseHexSize}
          isFocusable={true}
        >
          <div className="flex h-full w-full items-center justify-center">
            {props.interactive && userOwnsThisSpace ? (
              <button
                onClick={handleCreateClick}
                className="create-button pointer-events-auto relative z-20 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white opacity-0 shadow-lg transition-opacity duration-200 hover:bg-green-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-green-400 group-hover:opacity-100"
                aria-label={`Create new item${props.parentItem ? ` under ${props.parentItem.name}` : ""}`}
                title={`Create new item${props.parentItem ? ` under ${props.parentItem.name}` : ""}`}
              >
                <Plus size={16} />
              </button>
            ) : (
              <div className="text-center text-xs text-zinc-400">
                {props.interactive ? "You don't own this space" : "Empty"}
              </div>
            )}
          </div>
        </StaticBaseTileLayout>
      </div>

      {/* Dynamic dialog with optimistic updates */}
      {showModal && useDynamicDialog && (
        <DynamicCreateItemDialog
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          coordId={props.coordId}
          parentItem={props.parentItem}
          urlInfo={props.urlInfo}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Fallback modal if dynamic dialog is not available */}
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
