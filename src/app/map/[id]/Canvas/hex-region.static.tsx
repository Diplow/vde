import { getColorFromItem, StaticItemTile } from "../Tile/item.static";
import { StaticBaseTileLayout, type TileScale } from "../Tile/base.static";
import type { HexTileData } from "../State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

export interface StaticHexRegionProps {
  center: string;
  mapItems: Record<string, HexTileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale?: TileScale;
}

export const StaticHexRegion = ({
  center,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale = 3,
}: StaticHexRegionProps) => {
  const centerItem = mapItems[center];

  const isExpanded = centerItem
    ? expandedItemIds.includes(centerItem.metadata.dbId)
    : false;

  if (!centerItem) {
    return (
      <StaticBaseTileLayout
        coordId={center}
        scale={scale}
        baseHexSize={baseHexSize}
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
        isCenter={true}
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
        />
        <RenderChild
          coords={NE}
          mapItems={mapItems}
          baseHexSize={baseHexSize}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
        />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild
          coords={W}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
        />
        <div className="flex flex-col">
          <StaticItemTile
            item={centerItem}
            scale={nextScale}
            allExpandedItemIds={expandedItemIds}
            hasChildren={centerItemHasChildren}
            isCenter={true}
          />
        </div>
        <RenderChild
          coords={E}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
        />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild
          coords={SW}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
        />
        <RenderChild
          coords={SE}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
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
}

const RenderChild = ({
  coords,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale,
}: RenderChildProps) => {
  const item = mapItems[coords];
  const isExpanded = item
    ? expandedItemIds.includes(item.metadata.dbId)
    : false;

  if (!item) {
    return (
      <StaticBaseTileLayout
        coordId={coords}
        scale={scale}
        baseHexSize={baseHexSize}
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
    />
  );
};
