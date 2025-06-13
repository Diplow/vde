import { getColorFromItem, DynamicItemTile } from "../Tile/Item/item";
import {
  StaticBaseTileLayout,
  type TileScale,
} from "~/app/static/map/Tile/Base/base";
import { DynamicEmptyTile } from "../Tile/Empty/empty";
import type { TileData } from "../types/tile-data";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { URLInfo } from "../types/url-info";

export interface DynamicFrameProps {
  center: string;
  mapItems: Record<string, TileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale?: TileScale;
  urlInfo: URLInfo;
  interactive?: boolean;
  currentUserId?: number;
}

export const DynamicFrame = ({
  center,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale = 3,
  urlInfo,
  interactive = true,
  currentUserId,
}: DynamicFrameProps) => {
  const centerItem = mapItems[center];

  if (!centerItem) {
    return null;
  }

  const isExpanded = expandedItemIds.includes(centerItem.metadata.dbId);

  // Calculate child coordinates to check if item has children
  const centerCoord = centerItem.metadata.coordinates;
  const childCoordIds = [
    CoordSystem.createId({ ...centerCoord, path: [...centerCoord.path, 1] }),
    CoordSystem.createId({ ...centerCoord, path: [...centerCoord.path, 2] }),
    CoordSystem.createId({ ...centerCoord, path: [...centerCoord.path, 3] }),
    CoordSystem.createId({ ...centerCoord, path: [...centerCoord.path, 4] }),
    CoordSystem.createId({ ...centerCoord, path: [...centerCoord.path, 5] }),
    CoordSystem.createId({ ...centerCoord, path: [...centerCoord.path, 6] }),
  ];
  const centerItemHasChildren = childCoordIds.some(
    (childId) => mapItems[childId],
  );

  if (!isExpanded) {
    return (
      <DynamicItemTile
        item={centerItem}
        scale={scale}
        allExpandedItemIds={expandedItemIds}
        hasChildren={centerItemHasChildren}
        isCenter={centerItem.metadata.dbId === urlInfo.rootItemId}
        urlInfo={urlInfo}
        interactive={interactive}
        currentUserId={currentUserId}
      />
    );
  }

  // Re-use the already calculated values
  const [NW, NE, E, SE, SW, W] = childCoordIds as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  const nextScale: TileScale = scale > 1 ? ((scale - 1) as TileScale) : 1;

  const marginTopValue =
    scale === 2 ? baseHexSize / 2 : (baseHexSize / 2) * Math.pow(3, scale - 2);
  const marginTop = {
    marginTop: `-${marginTopValue}px`,
  };

  const frame = (
    <>
      <div className="flex justify-center">
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
          <DynamicItemTile
            item={centerItem}
            scale={nextScale}
            allExpandedItemIds={expandedItemIds}
            hasChildren={centerItemHasChildren}
            isCenter={centerItem.metadata.dbId === urlInfo.rootItemId}
            urlInfo={urlInfo}
            interactive={interactive}
            currentUserId={currentUserId}
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
    </>
  );

  return (
    <StaticBaseTileLayout
      baseHexSize={baseHexSize}
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
      <DynamicEmptyTile
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

  // If expanded (regardless of whether it has children), show the frame
  if (isExpanded) {
    return (
      <DynamicFrame
        center={coords}
        mapItems={mapItems}
        baseHexSize={baseHexSize}
        expandedItemIds={expandedItemIds}
        scale={scale}
        urlInfo={urlInfo}
        interactive={interactive}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <DynamicItemTile
      item={item}
      scale={scale}
      allExpandedItemIds={expandedItemIds}
      hasChildren={itemHasChildren}
      isCenter={item.metadata.dbId === urlInfo.rootItemId}
      urlInfo={urlInfo}
      interactive={interactive}
      currentUserId={currentUserId}
    />
  );
};
