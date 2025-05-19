import { notFound, redirect } from "next/navigation";
import { api } from "~/commons/trpc/server";
import Loading from "./loading";
import { StaticMapCanvas } from "./Canvas/index.static";
import { MapItemAPIContract } from "~/server/api/types/contracts";
import { MiniMapController } from "./Controls/mini-map.controller";
import { adapt, HexTileData } from "./State/types";
import {
  HexCoord,
  HexDirection,
} from "~/lib/domains/mapping/utils/hex-coordinates";
import { DEFAULT_HEXMAP_COLORS } from "~/lib/domains/mapping/_objects/hex-map";

interface HexMapPageProps {
  params: { id: string };
  searchParams: {
    scale?: string;
    expandedItems?: string;
    isDynamic?: string;
    focus?: string;
  };
}

export default async function HexMapPage({
  params,
  searchParams,
}: HexMapPageProps) {
  const { id: mapId } = await params;
  const searchParamsString = await searchParams;

  const { data: center } = await getMapData(mapId);

  if (!center || !center.center) {
    return notFound();
  }

  // Handle initial focus parameter
  if (!searchParamsString.focus) {
    const defaultFocus = center.center.coordinates;
    const currentPath = `/map/${mapId}`;
    const newSearchParams = new URLSearchParams(searchParamsString as any); // Cast to any to allow adding new params
    newSearchParams.set("focus", defaultFocus);
    return redirect(`${currentPath}?${newSearchParams.toString()}`);
  }

  const { data: items, error: itemsError } = await getMapItems(mapId);

  const { pathname, currentSearchParamsString: currentSearchParamsWithFocus } =
    safeGetPathnameAndSearchParams(searchParamsString, mapId);

  if (itemsError || !items) {
    return <Loading />;
  }

  const { scale, expandedItemIds, isDynamic, focus } = initMapParameters(
    searchParamsString,
    items,
  );

  // Prepare data for MiniMapController: get full item objects for expanded IDs
  const minimapControllerItems = items.filter((item) =>
    expandedItemIds.includes(item.id),
  );

  const mapItems = formatItems(items);
  return (
    <div className="relative flex h-full w-full flex-col">
      <StaticMapCanvas
        center={center.center.coordinates}
        items={mapItems}
        scale={scale}
        expandedItemIds={expandedItemIds}
        pathname={pathname}
        currentSearchParamsString={currentSearchParamsWithFocus}
      />
    </div>
  );
}

async function getMapItems(mapId: string) {
  try {
    const items = await api.map.getItems({ mapId });
    return { data: items, error: null };
  } catch (error) {
    console.error("Error loading map items:", error);
    return { data: null, error };
  }
}

async function getMapData(mapId: string) {
  try {
    return {
      data: await api.map.getOne({ id: mapId }),
      error: null,
    };
  } catch (error) {
    console.error("Error loading map:", error);
    return {
      data: null,
      error,
    };
  }
}

function initMapParameters(
  searchParams: HexMapPageProps["searchParams"],
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

function safeGetPathnameAndSearchParams(
  searchParams: HexMapPageProps["searchParams"],
  mapId: string,
) {
  const pathname = `/map/${mapId}`;

  // Safely construct currentSearchParamsString
  const knownSearchParams: Record<string, string> = {};
  if (searchParams.scale !== undefined) {
    knownSearchParams.scale = searchParams.scale;
  }
  if (searchParams.expandedItems !== undefined) {
    knownSearchParams.expandedItems = searchParams.expandedItems;
  }
  if (searchParams.isDynamic !== undefined) {
    knownSearchParams.isDynamic = searchParams.isDynamic;
  }
  if (searchParams.focus !== undefined) {
    knownSearchParams.focus = searchParams.focus;
  }
  const currentSearchParamsString = new URLSearchParams(
    knownSearchParams,
  ).toString();

  return { pathname, currentSearchParamsString };
}

export const formatItems = (items: MapItemAPIContract[]) => {
  const itemsById = items.map(adapt).reduce(
    (acc, item) => {
      if (item.metadata.coordinates.path.indexOf(0) !== -1) {
        return acc;
      }
      acc[item.metadata.coordId] = {
        ...item,
        data: {
          ...item.data,
          color: getColor(item.metadata.coordinates),
        },
      };
      return acc;
    },
    {} as Record<string, HexTileData>,
  );
  return itemsById;
};

function getColor(coordinates: HexCoord): string {
  if (coordinates.path.length < 1) {
    return "zinc-50";
  }
  return `${DEFAULT_HEXMAP_COLORS[coordinates.path[0] as HexDirection]}-${
    100 + 100 * coordinates.path.length
  }`;
}
