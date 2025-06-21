/**
 * Frame Component - Renders tiles that can expand to show their children.
 * 
 * Scale System:
 * - Center tile: scale 3
 *   └─ When expanded: scale 3 shallow tile containing:
 *       ├─ Center content: scale 2
 *       └─ Children: scale 2
 *           └─ When expanded: scale 2 shallow tile containing:
 *               ├─ Center content: scale 1
 *               └─ Children: scale 1 (cannot expand further)
 * 
 * The 90% scaling (scale-90) creates visual depth showing children are "inside" their parent.
 */

import { DynamicItemTile, getColorFromItem } from "../Tile/Item";
import {
  StaticBaseTileLayout,
  type TileScale,
} from "~/app/static/map/Tile/Base/base";
import { DynamicEmptyTile } from "../Tile/Empty/empty";
import type { TileData } from "../types/tile-data";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import type { URLInfo } from "../types/url-info";

const CHILD_INDICES = [1, 2, 3, 4, 5, 6] as const;

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

/**
 * A Frame is an expanded tile that shows its children in a hexagonal arrangement.
 * - If the tile is not expanded, it renders as a regular ItemTile
 * - If the tile is expanded, it becomes a Frame (shallow tile containing its children)
 * - Children can themselves be Frames if they are also expanded (recursive structure)
 */
export const DynamicFrame = (props: DynamicFrameProps) => {
  const { center, mapItems, scale = 3 } = props;
  const centerItem = mapItems[center];

  if (!centerItem) return null;

  const isExpanded = props.expandedItemIds?.includes(centerItem.metadata.dbId) ?? false;
  
  // Not expanded = regular tile
  if (!isExpanded) {
    return (
      <DynamicItemTile
        item={centerItem}
        scale={scale}
        allExpandedItemIds={props.expandedItemIds || []}
        hasChildren={hasChildren(centerItem, mapItems)}
        isCenter={centerItem.metadata.dbId === props.urlInfo.rootItemId}
        urlInfo={props.urlInfo}
        interactive={props.interactive}
        currentUserId={props.currentUserId}
      />
    );
  }

  // Expanded = Frame (shallow tile with children inside)
  // Scale progression: 3 (center) → 2 (children) → 1 (grandchildren) → 1 (cannot go lower)
  const nextScale: TileScale = scale > 1 ? ((scale - 1) as TileScale) : 1;

  return (
    <StaticBaseTileLayout
      baseHexSize={props.baseHexSize || 50}
      scale={scale}
      color={getColorFromItem(centerItem)}
      coordId={centerItem.metadata.coordId}
      _shallow={true}
    >
      <div className="scale-90 transform" style={{ position: "relative", zIndex: 5 }}>
        <FrameInterior
          {...props}
          centerItem={centerItem}
          scale={nextScale}
        />
      </div>
    </StaticBaseTileLayout>
  );
};

/**
 * Renders the interior content of a frame - the 7-tile hexagonal arrangement.
 * The scale passed here is already reduced by 1 from the parent frame's scale.
 * Example: If parent frame is scale 3, this interior renders at scale 2.
 */
const FrameInterior = (props: DynamicFrameProps & { 
  centerItem: TileData;
  scale: TileScale;
}) => {
  const { centerItem, baseHexSize = 50, scale } = props;
  
  // Calculate margin for hexagon rows
  const marginTop = scale === 2 
    ? baseHexSize / 2 
    : (baseHexSize / 2) * Math.pow(3, scale - 2);

  // Get child coordinates
  const childCoordIds = getChildCoordIds(centerItem);
  
  // Create position map
  const positionMap: Record<string, string | undefined> = {
    C: centerItem.metadata.coordId,
    NW: childCoordIds[0],
    NE: childCoordIds[1],
    E: childCoordIds[2],
    SE: childCoordIds[3],
    SW: childCoordIds[4],
    W: childCoordIds[5],
  };

  // Group tiles by row for rendering
  const rows = [
    ['NW', 'NE'],
    ['W', 'C', 'E'],
    ['SW', 'SE']
  ];

  return (
    <>
      {rows.map((row, rowIndex) => (
        <div 
          key={rowIndex}
          className="flex justify-center" 
          style={rowIndex > 0 ? { marginTop: `-${marginTop}px` } : undefined}
        >
          {row.map(position => {
            const coordId = positionMap[position];
            if (!coordId) return null;
            
            return (
              <FrameSlot
                key={position}
                {...props}
                coordId={coordId}
                isCenter={position === 'C'}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};

/**
 * Renders a single position within a frame.
 * Each slot can contain:
 * - An ItemTile (if not expanded)
 * - A Frame (if expanded - recursive!)
 * - An EmptyTile (if no item exists at this position)
 */
const FrameSlot = (props: DynamicFrameProps & {
  coordId: string;
  isCenter: boolean;
  scale: TileScale;
}) => {
  const { coordId, mapItems, isCenter } = props;
  const item = mapItems[coordId];

  // Empty slot
  if (!item && !isCenter) {
    const parentCoords = CoordSystem.getParentCoord(CoordSystem.parseId(coordId));
    if (!parentCoords) {
      throw new Error("Failed to get parent coordinates");
    }
    
    const parentCoordsId = CoordSystem.createId(parentCoords);
    const parentItem = mapItems[parentCoordsId];

    return (
      <DynamicEmptyTile
        coordId={coordId}
        scale={props.scale}
        baseHexSize={props.baseHexSize}
        urlInfo={props.urlInfo}
        parentItem={parentItem ? {
          id: parentItem.metadata.dbId,
          name: parentItem.data.name,
        } : undefined}
        interactive={props.interactive}
        currentUserId={props.currentUserId}
      />
    );
  }

  if (!item) return null;

  const isExpanded = props.expandedItemIds?.includes(item.metadata.dbId) ?? false;
  
  // Expanded child = render as Frame (recursive!)
  if (isExpanded) {
    return <DynamicFrame {...props} center={coordId} />;
  }

  // Not expanded = regular ItemTile
  return (
    <DynamicItemTile
      item={item}
      scale={props.scale}
      allExpandedItemIds={props.expandedItemIds || []}
      hasChildren={hasChildren(item, mapItems)}
      isCenter={item.metadata.dbId === props.urlInfo.rootItemId}
      urlInfo={props.urlInfo}
      interactive={props.interactive}
      currentUserId={props.currentUserId}
    />
  );
};

// Helper functions
const getChildCoordIds = (item: TileData): string[] => {
  const coord = item.metadata.coordinates;
  return CHILD_INDICES.map(idx => 
    CoordSystem.createId({ ...coord, path: [...coord.path, idx] })
  );
};

const hasChildren = (item: TileData, mapItems: Record<string, TileData>): boolean => {
  const childCoordIds = getChildCoordIds(item);
  return childCoordIds.some(childId => mapItems[childId]);
};