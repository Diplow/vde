import { getColorFromItem, StaticItemTile } from "../Tile/item.static";
import { StaticBaseTileLayout, type TileScale } from "../Tile/base.static";
import type { HexTileData } from "../State/types";
import { HexCoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

export interface StaticHexRegionProps {
  center: string;
  mapItems: Record<string, HexTileData>;
  baseHexSize?: number;
  expandedItemIds?: string[];
  scale?: TileScale;
  pathname: string;
  currentSearchParamsString: string;
}

export const StaticHexRegion = ({
  center,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale = 3,
  pathname,
  currentSearchParamsString,
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
  const centerItemChildCoordIds = HexCoordSystem.getChildCoordsFromId(
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
        pathname={pathname}
        currentSearchParamsString={currentSearchParamsString}
        allExpandedItemIds={expandedItemIds}
        hasChildren={centerItemHasChildren}
      />
    );
  }

  const [NW, NE, E, SE, SW, W] = HexCoordSystem.getChildCoordsFromId(center);

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
          pathname={pathname}
          currentSearchParamsString={currentSearchParamsString}
        />
        <RenderChild
          coords={NE}
          mapItems={mapItems}
          baseHexSize={baseHexSize}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          pathname={pathname}
          currentSearchParamsString={currentSearchParamsString}
        />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild
          coords={W}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          pathname={pathname}
          currentSearchParamsString={currentSearchParamsString}
        />
        <div className="flex flex-col">
          <StaticItemTile
            item={centerItem}
            scale={nextScale}
            pathname={pathname}
            currentSearchParamsString={currentSearchParamsString}
            allExpandedItemIds={expandedItemIds}
            hasChildren={centerItemHasChildren}
          />
        </div>
        <RenderChild
          coords={E}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          pathname={pathname}
          currentSearchParamsString={currentSearchParamsString}
        />
      </div>
      <div className="flex justify-center" style={marginTop}>
        <RenderChild
          coords={SW}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          pathname={pathname}
          currentSearchParamsString={currentSearchParamsString}
        />
        <RenderChild
          coords={SE}
          baseHexSize={baseHexSize}
          mapItems={mapItems}
          expandedItemIds={expandedItemIds}
          scale={nextScale}
          pathname={pathname}
          currentSearchParamsString={currentSearchParamsString}
        />
      </div>
    </div>
  );

  return (
    <StaticBaseTileLayout
      scale={scale}
      color={getColorFromItem(centerItem)}
      coordId={center}
      shallow={true}
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
  pathname: string;
  currentSearchParamsString: string;
}

const RenderChild = ({
  coords,
  mapItems,
  baseHexSize = 50,
  expandedItemIds = [],
  scale,
  pathname,
  currentSearchParamsString,
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
  const childItemChildCoordIds = HexCoordSystem.getChildCoordsFromId(
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
        pathname={pathname}
        currentSearchParamsString={currentSearchParamsString}
      />
    );
  }

  return (
    <StaticItemTile
      item={item}
      scale={scale}
      pathname={pathname}
      currentSearchParamsString={currentSearchParamsString}
      allExpandedItemIds={expandedItemIds}
      hasChildren={itemHasChildren}
    />
  );
};
