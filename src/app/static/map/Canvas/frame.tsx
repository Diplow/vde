import { getColorFromItem, StaticItemTile } from "~/app/static/map/Tile/Item/item";
import { StaticBaseTileLayout, type TileScale } from "~/app/static/map/Tile/Base/base";
import { StaticEmptyTile } from "~/app/static/map/Tile/Empty/empty";
import type { TileData } from "~/app/map/types/tile-data";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { URLInfo } from "~/app/map/types/url-info";

export interface StaticFrameProps {
  center: string;
  mapItems: Record<string, TileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale?: TileScale;
  urlInfo: URLInfo;
  interactive?: boolean;
  currentUserId?: number;
}

export const StaticFrame = ({
  center,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale = 3,
  urlInfo,
  interactive = true,
  currentUserId,
}: StaticFrameProps) => {
  const centerItem = mapItems[center];

  const isExpanded = centerItem
    ? expandedItemIds.includes(centerItem.metadata.dbId)
    : false;

  if (!centerItem) {
    // Find parent item for context
    const parentCoords = center.split(":").slice(0, -1).join(":");
    const parentItem = parentCoords ? mapItems[parentCoords] : undefined;

    return (
      <StaticEmptyTile
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

  // Generate test ID for the frame
  const frameTestId = `frame-${centerItem.metadata.coordinates.userId}-${centerItem.metadata.coordinates.groupId}-${centerItem.metadata.coordinates.path.join("-")}`;
  
  const frame = (
    <div className="flex flex-col items-center justify-center" data-testid={frameTestId}>
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
            stroke={{ color: "transparent" as const, width: 0 }}
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
        {frame}
      </div>
    </StaticBaseTileLayout>
  );
};

interface RenderChildProps {
  coords: string;
  mapItems: Record<string, TileData>;
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
      <StaticEmptyTile
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
      <StaticFrame
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
