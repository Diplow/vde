"use client";

import type { TileData } from "~/app/map/types/tile-data";
import { DynamicBaseTileLayout } from "~/app/map/Tile/Base";
import type { TileScale, TileColor } from "~/app/static/map/Tile/Base/base";
import { DynamicTileContent } from "../content";
import { DynamicTileButtons } from "../item.buttons";
import type { URLInfo } from "~/app/map/types/url-info";

interface ItemTileContentProps {
  item: TileData;
  scale: TileScale;
  baseHexSize: number;
  tileColor: TileColor;
  testId: string;
  interactive: boolean;
  isBeingDragged: boolean;
  urlInfo: URLInfo;
  allExpandedItemIds: string[];
  hasChildren: boolean;
  isCenter: boolean;
  canEdit: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

/**
 * Renders the content of an item tile including the base layout and buttons
 * Separates the visual presentation from the interaction logic
 */
export function ItemTileContent({
  item,
  scale,
  baseHexSize,
  tileColor,
  testId,
  interactive,
  isBeingDragged,
  urlInfo,
  allExpandedItemIds,
  hasChildren,
  isCenter,
  canEdit,
  onEditClick,
  onDeleteClick,
}: ItemTileContentProps) {
  return (
    <>
      <DynamicBaseTileLayout
        coordId={item.metadata.coordId}
        scale={scale}
        color={tileColor}
        baseHexSize={baseHexSize}
        isFocusable={false}
        isExpanded={allExpandedItemIds.includes(item.metadata.dbId)}
      >
        <DynamicTileContent
          data={{
            title: item.data.name,
            description: item.data.description,
            url: item.data.url,
          }}
          scale={scale}
          tileId={testId.replace("tile-", "")}
        />
      </DynamicBaseTileLayout>
      {interactive && !isBeingDragged && (
        <DynamicTileButtons
          item={item}
          urlInfo={urlInfo}
          displayConfig={{ scale, isCenter }}
          expansionState={{ allExpandedItemIds, hasChildren }}
          canEdit={canEdit}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      )}
    </>
  );
}