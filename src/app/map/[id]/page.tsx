import { notFound, redirect } from "next/navigation";
import { api } from "~/commons/trpc/server";
import { StaticMapCanvas, type CenterInfo } from "./Canvas/index.static";
import { type MapItemAPIContract } from "~/server/api/types/contracts";
import { adapt, type HexTileData } from "./State/types";
import { CoordSystem } from "~/lib/domains/mapping/utils/hex-coordinates";
import { type URLInfo } from "./types/url-info";

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

  const urlInfo: URLInfo = {
    pathname: `/map/${rootItemId}`,
    searchParamsString: new URLSearchParams(
      searchParamsString as any,
    ).toString(),
    rootItemId,
    scale: searchParamsString.scale,
    expandedItems: searchParamsString.expandedItems,
    isDynamic: searchParamsString.isDynamic,
    focus: searchParamsString.focus,
  };

  const { data: rootItem } = await getRootItemData(urlInfo.rootItemId);

  if (!rootItem) {
    return notFound();
  }

  // Handle initial focus parameter - default to root item coordinates
  if (!urlInfo.focus) {
    const defaultFocus = rootItem.coordinates;
    const currentPath = `/map/${urlInfo.rootItemId}`;
    const newSearchParams = new URLSearchParams(searchParamsString as any);
    newSearchParams.set("focus", defaultFocus);
    return redirect(`${currentPath}?${newSearchParams.toString()}`);
  }

  const { data: items, error: itemsError } = await getMapItems(
    urlInfo.rootItemId,
  );

  if (itemsError || !items) {
    return null; // TODO: Re-enable Loading component when ready
  }

  const { scale, expandedItemIds } = initMapParameters(urlInfo, items);

  const mapItems = formatItems(items);

  // Extract userId and groupId from root item coordinates for components that need them
  const rootCoords = CoordSystem.parseId(rootItem.coordinates);

  const centerInfo: CenterInfo = {
    center: rootItem.coordinates,
    rootItemId: parseInt(urlInfo.rootItemId),
    userId: rootCoords.userId,
    groupId: rootCoords.groupId,
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      <StaticMapCanvas
        centerInfo={centerInfo}
        items={mapItems}
        scale={scale}
        expandedItemIds={expandedItemIds}
        urlInfo={urlInfo}
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

function initMapParameters(urlInfo: URLInfo, items: MapItemAPIContract[]) {
  const expandedItemIdsFromUrl = urlInfo.expandedItems
    ? urlInfo.expandedItems.split(",")
    : [];
  return {
    scale: urlInfo.scale ? parseInt(urlInfo.scale) : 3,
    expandedItemIds: items
      .filter((item) => expandedItemIdsFromUrl.includes(item.id))
      .map((item) => item.id),
    isDynamic: urlInfo.isDynamic ? urlInfo.isDynamic === "true" : false,
    focus: urlInfo.focus!,
  };
}

const formatItems = (items: MapItemAPIContract[]) => {
  const itemsById = items.map(adapt).reduce(
    (acc, item) => {
      if (item.metadata.coordinates.path.includes(0)) {
        return acc;
      }
      acc[item.metadata.coordId] = item;
      return acc;
    },
    {} as Record<string, HexTileData>,
  );
  return itemsById;
};
