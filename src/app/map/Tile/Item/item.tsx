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
  const isDropTargetActive = tileActions?.isDropTarget(item.metadata.coordId) === true;
  
  // Prepare drag handlers if draggable
  const dragProps = isDraggable && tileActions ? {
    draggable: true,
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => tileActions.dragHandlers.onDragStart(item.metadata.coordId, e),
    onDragEnd: tileActions.dragHandlers.onDragEnd,
    style: {
      opacity: isBeingDragged ? 0.5 : 1,
      cursor: isBeingDragged ? 'grabbing' : (isDraggable ? 'grab' : 'default'),
    }
  } : {};

  return (
    <>
    <div 
      className={`group relative hover:z-10`} 
      data-testid={testId}
      {...dragProps}>
      {/* Hexagon tile with full hover area */}
      <DynamicBaseTileLayout
        coordId={item.metadata.coordId}
        scale={scale}
        color={getColorFromItem(item)}
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
      {interactive && (
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
