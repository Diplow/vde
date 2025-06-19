"use client";

import type { TileData } from "../../types/tile-data";
import type { TileScale } from "~/app/static/map/Tile/Base/base";
import type { URLInfo } from "../../types/url-info";
import { useItemState } from "./_hooks";
import { ItemDialogs } from "./_components/item-dialogs";
import { ItemTileContent } from "./_components/item-tile-content";

import type { TileStroke } from "~/app/static/map/Tile/Base/base";

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
  stroke?: TileStroke;
}

export const DynamicItemTile = (props: DynamicItemTileProps) => {
  const {
    item,
    scale = 1,
    baseHexSize = 50,
    allExpandedItemIds,
    hasChildren,
    isCenter = false,
    interactive = true,
    currentUserId,
    stroke,
  } = props;

  const state = useItemState({ 
    item, 
    currentUserId, 
    interactive,
    allExpandedItemIds,
    hasChildren,
    isCenter,
    scale
  });

  return (
    <>
      <div 
        className={`group relative hover:z-10 ${state.interaction.isBeingDragged ? 'dragging' : ''}`} 
        data-testid={state.testId}
        {...state.dragProps}
        {...state.dropProps}>
        <ItemTileContent
          {...props}
          scale={scale}
          baseHexSize={baseHexSize}
          isCenter={isCenter}
          interactive={interactive}
          tileColor={state.tileColor}
          testId={state.testId}
          isBeingDragged={state.interaction.isBeingDragged}
          canEdit={state.canEdit}
          onEditClick={state.dialogs.openUpdateDialog}
          onDeleteClick={state.dialogs.openDeleteDialog}
          stroke={stroke}
        />
      </div>
      <ItemDialogs item={item} dialogState={state.dialogs} />
    </>
  );
};