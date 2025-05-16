import type { HexMap, MapItemWithId } from "../_objects";
import { DEPTH_TINTS, type HexColorTint } from "../_objects/hex-map";
import { HexCoordSystem } from "../utils/hex-coordinates";

export const mapItemDomainToContractAdapter = (
  aggregate: MapItemWithId,
  mapId: string | number,
) => {
  return {
    id: String(aggregate.id),
    mapId: String(mapId),
    coords: HexCoordSystem.createId(aggregate.attrs.coords),
    name: aggregate.ref.attrs.title,
    descr: aggregate.ref.attrs.descr,
    url: aggregate.ref.attrs.link,
    depth: aggregate.attrs.coords.path.length,
    color: `${aggregate.parent?.attrs.color || aggregate.attrs.color}-${DEPTH_TINTS[aggregate.attrs.coords.path.length as HexColorTint]}`,
    parentId: String(aggregate.attrs.parentId),
    neighborIds: aggregate.neighbors.map((neighbor) => String(neighbor.id)),
  };
};

export type MapItemContract = ReturnType<typeof mapItemDomainToContractAdapter>;

export /**
 * Adapts a HexMap aggregate to a contract
 */
const mapDomainToContractAdapter = (aggregate: HexMap) => {
  if (aggregate.id === undefined) {
    // This shouldn't happen when adapting a persisted map
    throw new Error("Cannot adapt map without an ID");
  }
  // Pass the map's ID when adapting the center item
  const center = mapItemDomainToContractAdapter(aggregate.center, aggregate.id);
  return {
    id: String(aggregate.id),
    title: center.name,
    descr: center.descr,
    radius: Number(aggregate.attrs.radius),
    itemCount: aggregate.items.length,
    center,
  };
};

export type MapContract = ReturnType<typeof mapDomainToContractAdapter>;

export const adapt = {
  map: mapDomainToContractAdapter,
  mapItem: mapItemDomainToContractAdapter,
};
