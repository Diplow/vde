import { getColorFromItem, StaticItemTile } from "../Tile/Item/item.static";
import { StaticBaseTileLayout, type TileScale } from "../Tile/Base/base.static";
import { ProgressiveEmptyTile } from "../Tile/Empty/empty.progressive";
import type { HexTileData } from "../State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { URLInfo } from "../types/url-info";

export interface StaticHexRegionProps {
  center: string;
  mapItems: Record<string, HexTileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale?: TileScale;
  urlInfo: URLInfo;
  interactive?: boolean;
  currentUserId?: number;
}

export const StaticHexRegion = ({
  center,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale = 3,
  urlInfo,
  interactive = true,
  currentUserId,
}: StaticHexRegionProps) => {
  const centerItem = mapItems[center];

  const isExpanded = centerItem
    ? expandedItemIds.includes(centerItem.metadata.dbId)
    : false;

  if (!centerItem) {
    // Find parent item for context
    const parentCoords = center.split(":").slice(0, -1).join(":");
    const parentItem = parentCoords ? mapItems[parentCoords] : undefined;

    return (
      <ProgressiveEmptyTile
        coordId={center}
        scale={scale}
        baseHexSize={baseHexSize}
        urlInfo={urlInfo}
        parentItem={
          parentItem
            ? {
                id: parentItem.metadata.dbId,
                name: parentItem.data.name,
              }
            : undefined
        }
        interactive={interactive}
        currentUserId={currentUserId}
      />
    );
  }

  // Calculate if centerItem has children
  const centerItemChildCoordIds = CoordSystem.getChildCoordsFromId(
    centerItem.metadata.coordId,
  );
  const centerItemHasChildren = centerItemChildCoordIds.some(
    (childId) => mapItems[childId],
  );

  if (!isExpanded) {
    return (
      <StaticItemTile
        item={centerItem}
        scale={scale}
        baseHexSize={baseHexSize}
        allExpandedItemIds={expandedItemIds}
        hasChildren={centerItemHasChildren}
        isCenter={centerItem.metadata.dbId === urlInfo.rootItemId}
        urlInfo={urlInfo}
        interactive={interactive}
      />
    );
  }

  const [NW, NE, E, SE, SW, W] = CoordSystem.getChildCoordsFromId(center);

  const marginTopValue =
    scale === 2 ? baseHexSize / 2 : (baseHexSize / 2) * Math.pow(3, scale - 2);
  const marginTop = {
    marginTop: `-${marginTopValue}px`,
  };

  const nextScale = (scale - 1) as TileScale;

  const region = (
    <div className="flex flex-col items-center justify-center">
      <div className="flex justify-center p-0">
        <RenderChild
          coords={NW}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          urlInfo={urlInfo}
          interactive={interactive}
          currentUserId={currentUserId}
        />
        <RenderChild
          coords={NE}
          mapItems={mapItems}
          baseHexSize={baseHexSize}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          urlInfo={urlInfo}
          interactive={interactive}
          currentUserId={currentUserId}
        />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild
          coords={W}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          urlInfo={urlInfo}
          interactive={interactive}
          currentUserId={currentUserId}
        />
        <div className="flex flex-col">
          <StaticItemTile
            item={centerItem}
            scale={nextScale}
            allExpandedItemIds={expandedItemIds}
            hasChildren={centerItemHasChildren}
            isCenter={centerItem.metadata.dbId === urlInfo.rootItemId}
            urlInfo={urlInfo}
            interactive={interactive}
          />
        </div>
        <RenderChild
          coords={E}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          urlInfo={urlInfo}
          interactive={interactive}
          currentUserId={currentUserId}
        />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild
          coords={SW}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          urlInfo={urlInfo}
          interactive={interactive}
          currentUserId={currentUserId}
        />
        <RenderChild
          coords={SE}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          urlInfo={urlInfo}
          interactive={interactive}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );

  return (
    <StaticBaseTileLayout
      scale={scale}
      color={getColorFromItem(centerItem)}
      coordId={center}
      _shallow={true}
    >
      <div
        className="scale-90 transform"
        style={{ position: "relative", zIndex: 5 }}
      >
        {region}
      </div>
    </StaticBaseTileLayout>
  );
};

interface RenderChildProps {
  coords: string;
  mapItems: Record<string, HexTileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale: TileScale;
  urlInfo: URLInfo;
  interactive?: boolean;
  currentUserId?: number;
}

const RenderChild = ({
  coords,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale,
  urlInfo,
  interactive = true,
  currentUserId,
}: RenderChildProps) => {
  const item = mapItems[coords];
  const isExpanded = item
    ? expandedItemIds.includes(item.metadata.dbId)
    : false;

  if (!item) {
    // Find parent item for context
    const parentCoords = CoordSystem.getParentCoord(
      CoordSystem.parseId(coords),
    );
    if (!parentCoords) {
      throw new Error("Failed to get parent coordinates");
    }
    const parentCoordsId = CoordSystem.createId(parentCoords);
    const parentItem = parentCoordsId ? mapItems[parentCoordsId] : undefined;

    return (
      <ProgressiveEmptyTile
        coordId={coords}
        scale={scale}
        baseHexSize={baseHexSize}
        urlInfo={urlInfo}
        parentItem={
          parentItem
            ? {
                id: parentItem.metadata.dbId,
                name: parentItem.data.name,
              }
            : undefined
        }
        interactive={interactive}
        currentUserId={currentUserId}
      />
    );
  }

  // Calculate if the current child item has children
  const childItemChildCoordIds = CoordSystem.getChildCoordsFromId(
    item.metadata.coordId,
  );
  const itemHasChildren = childItemChildCoordIds.some(
    (childId) => mapItems[childId],
  );

  if (isExpanded) {
    return (
      <StaticHexRegion
        center={coords}
        mapItems={mapItems}
        expandedItemIds={expandedItemIds}
        scale={scale}
        urlInfo={urlInfo}
        interactive={interactive}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <StaticItemTile
      item={item}
      scale={scale}
      allExpandedItemIds={expandedItemIds}
      hasChildren={itemHasChildren}
      isCenter={false}
      urlInfo={urlInfo}
      interactive={interactive}
    />
  );
};
