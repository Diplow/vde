import type { HexMap, MapItemWithId } from "../_objects";
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
  if (!aggregate.center) {
    throw new Error("Cannot adapt map without a center");
  }
  const center = mapItemDomainToContractAdapter(aggregate.center, aggregate.id);
  return {
    id: String(aggregate.id),
    title: center.name,
    descr: center.descr,
    itemCount: aggregate.items?.length || 1,
    center,
  };
};

export type MapContract = ReturnType<typeof mapDomainToContractAdapter>;

export const adapt = {
  map: mapDomainToContractAdapter,
  mapItem: mapItemDomainToContractAdapter,
};
