import type { MapItemEntity, OwnerEntity, MapAggregate } from "./objects";
import { HexCoordinateSystem } from "~/lib/hex-coordinates";

const ownerAdapter = (entity: OwnerEntity) => {
  return {
    id: String(entity.data.id),
  };
};

export type OwnerContract = ReturnType<typeof ownerAdapter>;

const mapItemAdapter = (entity: MapItemEntity) => {
  return {
    itemId: String(entity.data.itemId),
    itemType: entity.data.itemType,
    coordinates: HexCoordinateSystem.createId(entity.data.coordinates),
  };
};

export type MapItemContract = ReturnType<typeof mapItemAdapter>;

const mapAdapter = (entity: MapAggregate) => {
  return {
    id: String(entity.data.id),
    name: entity.data.name,
    description: entity.data.description,
    rows: entity.data.rows,
    columns: entity.data.columns,
    baseSize: entity.data.baseSize,
    createdAt: entity.data.createdAt.toISOString(),
    updatedAt: entity.data.updatedAt.toISOString(),
    owner: ownerAdapter(entity.owner),
    items: entity.items.map(mapItemAdapter),
  };
};

export type MapContract = ReturnType<typeof mapAdapter>;

export const adapters = {
  owner: ownerAdapter,
  map: mapAdapter,
  mapItem: mapItemAdapter,
};
