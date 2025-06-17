"use client";

import { useState, lazy, Suspense, useContext } from "react";
import type { TileData } from "../../types/tile-data";
import {
  DynamicBaseTileLayout,
} from "../Base";
import {
  type TileColor,
  type TileScale,
} from "~/app/static/map/Tile/Base/base";
import { DynamicTileContent } from "./content";
import { DynamicTileButtons } from "./item.buttons";
import type { URLInfo } from "../../types/url-info";
import { testLogger } from "~/lib/test-logger";
import { TileActionsContext } from "../../Canvas";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { getColor as calculateColor } from "../../types/tile-data";

// Lazy load the modals
const UpdateItemDialog = lazy(() =>
  import("../../Dialogs/update-item").then((module) => ({
    default: module.UpdateItemDialog,
  })),
);

const DeleteItemDialog = lazy(() =>
  import("../../Dialogs/delete-item").then((module) => ({
    default: module.DeleteItemDialog,
  })),
);

export interface DynamicItemTileProps {
  item: TileData;
  scale?: TileScale;
  baseHexSize?: number;
  allExpandedItemIds: string[];
  hasChildren: boolean;
  isCenter?: boolean;
  urlInfo: URLInfo;
  interactive?: boolean;
  currentUserId?: number;
}

export const getColorFromItem = (item: TileData): TileColor => {
  const [colorName, tint] = item.data.color.split("-");
  return {
    color: colorName as TileColor["color"],
    tint: tint as TileColor["tint"],
  };
};

export const DynamicItemTile = ({
  item,
  scale = 1,
  baseHexSize = 50,
  allExpandedItemIds,
  hasChildren,
  isCenter = false,
  urlInfo,
  interactive = true,
  currentUserId,
}: DynamicItemTileProps) => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Get tile actions from context (may be null if not within Canvas)
  const tileActions = useContext(TileActionsContext);
  
  // Check if current user owns this item
  const canEdit = currentUserId !== undefined && item.metadata.ownerId === currentUserId.toString();
  
  // Generate test ID from coordinates
  const pathPart = item.metadata.coordinates.path.length > 0 ? `-${item.metadata.coordinates.path.join("-")}` : '';
  const testId = `tile-${item.metadata.coordinates.userId}-${item.metadata.coordinates.groupId}${pathPart}`;

  // Log tile rendering for E2E tests
  testLogger.component("DynamicItemTile", {
    testId,
    name: item.data.name,
    dbId: item.metadata.dbId,
    coordinates: item.metadata.coordId,
    isExpanded: allExpandedItemIds.includes(item.metadata.dbId),
    hasChildren,
    isCenter,
    scale,
  });
  
  // Determine if this tile can be dragged
  const isDraggable = interactive && tileActions?.canDragTile(item.metadata.coordId) === true;
  const isBeingDragged = tileActions?.isDraggingTile(item.metadata.coordId) === true;
  
  // Check if this tile is a valid drop target for swapping
  const isValidDropTarget = tileActions?.isValidDropTarget(item.metadata.coordId) === true;
  const isDropTargetActive = tileActions?.isDropTarget(item.metadata.coordId) === true;
  const dropOperation = tileActions?.getDropOperation(item.metadata.coordId) ?? null;
  
  // For swap operations, show preview of the color it would have after swap
  let swapPreviewColor = getColorFromItem(item);
  if (isDropTargetActive && dropOperation === 'swap') {
    // The dragged tile would take this position's coordinates
    const targetCoords = CoordSystem.parseId(item.metadata.coordId);
    const previewColorString = calculateColor(targetCoords);
    const [colorName, tint] = previewColorString.split("-");
    swapPreviewColor = {
      color: colorName as TileColor["color"],
      tint: tint as TileColor["tint"]
    };
  }
  
  // Prepare drag handlers if draggable
  const dragProps = isDraggable && tileActions ? {
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => tileActions.dragHandlers.onDragStart(item.metadata.coordId, e),
    onDragEnd: tileActions.dragHandlers.onDragEnd,
  } : {};
  
  // Prepare style for drag state
  const dragStyle = {
    cursor: isBeingDragged ? 'grabbing' : (isDraggable ? 'grab' : 'default'),
  };
  
  // Add drop handlers if this is a valid drop target
  const dropProps = isValidDropTarget && tileActions ? {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => tileActions.dragHandlers.onDragOver(item.metadata.coordId, e),
    onDragLeave: tileActions.dragHandlers.onDragLeave,
    onDrop: (e: React.DragEvent<HTMLDivElement>) => tileActions.dragHandlers.onDrop(item.metadata.coordId, e),
  } : {};

  return (
    <>
    <div 
      className={`group relative hover:z-10 ${isBeingDragged ? 'dragging' : ''}`} 
      data-testid={testId}
      style={dragStyle}
      {...dragProps}
      {...dropProps}>
      {/* Hexagon tile with full hover area */}
      <DynamicBaseTileLayout
        coordId={item.metadata.coordId}
        scale={scale}
        color={isDropTargetActive && dropOperation === 'swap' ? swapPreviewColor : getColorFromItem(item)}
        baseHexSize={baseHexSize}
        isFocusable={false}
      >
        <DynamicTileContent
          data={{
            title: item.data.name,
            description: item.data.description,
            url: item.data.url,
          }}
          scale={scale}
          tileId={`${item.metadata.coordinates.userId}-${item.metadata.coordinates.groupId}${pathPart}`}
        />
      </DynamicBaseTileLayout>
      {interactive && !isBeingDragged && (
        <DynamicTileButtons
          item={item}
          urlInfo={urlInfo}
          displayConfig={{
            scale,
            isCenter,
          }}
          expansionState={{
            allExpandedItemIds,
            hasChildren,
          }}
          canEdit={canEdit}
          onEditClick={() => setShowUpdateDialog(true)}
          onDeleteClick={() => setShowDeleteDialog(true)}
        />
      )}
    </div>

    {/* Update Dialog */}
    {showUpdateDialog && (
      <Suspense fallback={null}>
        <UpdateItemDialog
          isOpen={showUpdateDialog}
          onClose={() => setShowUpdateDialog(false)}
          item={item}
        />
      </Suspense>
    )}

    {/* Delete Dialog */}
    {showDeleteDialog && (
      <Suspense fallback={null}>
        <DeleteItemDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          item={item}
        />
      </Suspense>
    )}
  </>
  );
};
