"use client";

import { useState, useContext } from "react";
import { Plus } from "lucide-react";
import { StaticBaseTileLayout, type TileScale, type TileColor } from "~/app/static/map/Tile/Base/base";
import { CreateItemModal } from "../../Dialogs/create-item.modal";
import { DynamicCreateItemDialog } from "../../Dialogs/create-item";
import { TileActionsContext } from "../../Canvas";
import type { URLInfo } from "../../types/url-info";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { getColor } from "../../types/tile-data";

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
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate default stroke for this scale
  const defaultStroke = props.scale === 3 
    ? { color: "zinc-950" as const, width: 0.75 } 
    : props.scale === 2 
      ? { color: "zinc-900" as const, width: 0.5 } 
      : props.scale === 1 
        ? { color: "zinc-900" as const, width: 0.25 } 
        : { color: "transparent" as const, width: 0 };

  // Safely check if we're within a DynamicMapCanvas context
  const tileActions = useContext(TileActionsContext);


  // If context is not available, we'll still render but without the context actions
  const onCreateTileRequested = tileActions?.onCreateTileRequested;
  
  // Check if this tile is a valid drop target
  const isValidDropTarget = tileActions?.isValidDropTarget(props.coordId) === true;
  const isDropTargetActive = tileActions?.isDropTarget(props.coordId) === true;
  const dropOperation = tileActions?.getDropOperation(props.coordId) ?? null;
  
  // Calculate the color this tile would have if something was moved here
  const targetCoords = CoordSystem.parseId(props.coordId);
  const previewColor = getColor(targetCoords);


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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...dropProps}>
        {/* Invisible hover area overlay to ensure full tile responds to hover */}
        <div className="pointer-events-auto absolute inset-0 z-10" />

        <StaticBaseTileLayout
          coordId={props.coordId}
          scale={props.scale ?? 1}
          color={(() => {
            if (isDropTargetActive && dropOperation === 'move') {
              // Show the color the tile would have after the move
              const [colorName, tint] = previewColor.split("-");
              return {
                color: colorName as TileColor["color"],
                tint: tint as TileColor["tint"]
              };
            }
            return undefined; // No fill color for transparent tiles
          })()}
          stroke={isHovered ? defaultStroke : { color: "transparent", width: 0 }}
          cursor="cursor-pointer"
          baseHexSize={props.baseHexSize}
          isFocusable={true}
        >
          <div className="absolute inset-0">
            {/* Semi-transparent black overlay clipped to hexagon shape */}
            <div 
              className={`absolute inset-0 transition-colors duration-200 ${
                isHovered ? 'bg-black/10' : ''
              }`}
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
              }}
            />
            
            {/* Content on top of the overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
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
                <div className="text-center text-xs text-zinc-300">
                  {props.interactive ? "You don't own this space" : "Empty"}
                </div>
              )}
            </div>
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
