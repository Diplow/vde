import { notFound, redirect } from "next/navigation";
import { api } from "~/commons/trpc/server";
import { StaticMapCanvas } from "./Canvas/index.static";
import { MapItemAPIContract } from "~/server/api/types/contracts";
import { adapt, HexTileData } from "./State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";

interface HexMapPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    scale?: string;
    expandedItems?: string;
    isDynamic?: string;
    focus?: string;
  }>;
}

export default async function HexMapPage({
  params,
  searchParams,
}: HexMapPageProps) {
  const { id: rootItemId } = await params;
  const searchParamsString = await searchParams;

  const { data: rootItem } = await getRootItemData(rootItemId);

  if (!rootItem) {
    return notFound();
  }

  // Handle initial focus parameter - default to root item coordinates
  if (!searchParamsString.focus) {
    const defaultFocus = rootItem.coordinates;
    const currentPath = `/map/${rootItemId}`;
    const newSearchParams = new URLSearchParams(searchParamsString as any);
    newSearchParams.set("focus", defaultFocus);
    return redirect(`${currentPath}?${newSearchParams.toString()}`);
  }

  const { data: items, error: itemsError } = await getMapItems(rootItemId);

  if (itemsError || !items) {
    return null; // TODO: Re-enable Loading component when ready
  }

  const { scale, expandedItemIds } = initMapParameters(
    searchParamsString,
    items,
  );

  const mapItems = formatItems(items);

  // Extract userId and groupId from root item coordinates for components that need them
  const rootCoords = CoordSystem.parseId(rootItem.coordinates);

  return (
    <div className="relative flex h-full w-full flex-col">
      <StaticMapCanvas
        center={rootItem.coordinates}
        items={mapItems}
        scale={scale}
        expandedItemIds={expandedItemIds}
        rootItemId={parseInt(rootItemId)}
        userId={rootCoords.userId}
        groupId={rootCoords.groupId}
      />
    </div>
  );
}

async function getMapItems(rootItemId: string) {
  try {
    // First get the root item to extract userId and groupId
    const rootItem = await api.map.getRootItemById({
      mapItemId: parseInt(rootItemId),
    });

    const rootCoords = CoordSystem.parseId(rootItem.coordinates);

    const items = await api.map.getItemsForRootItem({
      userId: rootCoords.userId,
      groupId: rootCoords.groupId,
    });
    return { data: items, error: null };
  } catch (error) {
    console.error("Error loading map items:", error);
    return { data: null, error };
  }
}

async function getRootItemData(rootItemId: string) {
  try {
    const rootItem = await api.map.getRootItemById({
      mapItemId: parseInt(rootItemId),
    });
    return { data: rootItem, error: null };
  } catch (error) {
    console.error("Error loading root item:", error);
    return { data: null, error };
  }
}

function initMapParameters(
  searchParams: {
    scale?: string;
    expandedItems?: string;
    isDynamic?: string;
    focus?: string;
  },
  items: MapItemAPIContract[],
) {
  const expandedItemIdsFromUrl = searchParams.expandedItems
    ? searchParams.expandedItems.split(",")
    : [];
  return {
    scale: searchParams.scale ? parseInt(searchParams.scale) : 3,
    expandedItemIds: items
      .filter((item) => expandedItemIdsFromUrl.includes(item.id))
      .map((item) => item.id),
    isDynamic: searchParams.isDynamic
      ? searchParams.isDynamic === "true"
      : false,
    focus: searchParams.focus as string,
  };
}

const formatItems = (items: MapItemAPIContract[]) => {
  const itemsById = items.map(adapt).reduce(
    (acc, item) => {
      if (item.metadata.coordinates.path.indexOf(0) !== -1) {
        return acc;
      }
      acc[item.metadata.coordId] = item;
      return acc;
    },
    {} as Record<string, HexTileData>,
  );
  return itemsById;
};
