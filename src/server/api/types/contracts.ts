/**
 * Contract to API adapters for transforming domain contracts to API responses
 */
import type {
  MapContract,
  MapItemContract,
} from "~/lib/domains/mapping/types/contracts";

/**
 * Transform a domain map item contract to an API map item contract
 */
export const mapItemContractToApiAdapter = (contract: MapItemContract) => {
  return {
    id: contract.id,
    mapId: contract.mapId,
    coordinates: contract.coords,
    color: contract.color,
    depth: contract.depth,
    name: contract.name,
    descr: contract.descr,
    url: contract.url,
    neighbors: contract.neighborIds,
    parentId: contract.parentId,
  };
};

export type MapItemAPIContract = ReturnType<typeof mapItemContractToApiAdapter>;

/**
 * Transform a domain map contract to an API map contract
 */
export const mapContractToApiAdapter = (contract: MapContract) => {
  return {
    id: contract.id,
    title: contract.title,
    descr: contract.descr,
    radius: contract.radius,
    itemCount: contract.itemCount,
    center: mapItemContractToApiAdapter(contract.center),
  };
};

export type MapAPIContract = ReturnType<typeof mapContractToApiAdapter>;

/**
 * Export all adapters in a single object
 */
export const contractToApiAdapters = {
  mapItem: mapItemContractToApiAdapter,
  map: mapContractToApiAdapter,
};
