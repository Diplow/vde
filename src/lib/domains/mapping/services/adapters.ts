import type {
  MapItemAggregate,
  OwnerEntity,
  MapAggregate,
  MapItemReference,
} from "~/lib/domains/mapping/objects";
import { HexCoordinateSystem } from "~/lib/hex-coordinates";

const ownerAdapter = (entity: OwnerEntity) => {
  return {
    id: String(entity.data.id),
  };
};

export type OwnerContract = ReturnType<typeof ownerAdapter>;

const mapItemAdapter = (entity: MapItemAggregate) => {
  return {
    id: String(entity.data.id),
    mapId: String(entity.data.mapId),
    coordinates: HexCoordinateSystem.createId(entity.data.coordinates),
    reference: {
      id: String(entity.data.reference.id),
      type: entity.data.reference.type,
    },
    owner: ownerAdapter(entity.owner),
    relatedItems: entity.relatedMapItems
      ? entity.relatedMapItems.map((item) => String(item.data.id))
      : [],
    createdAt: entity.data.createdAt.toISOString(),
    updatedAt: entity.data.updatedAt.toISOString(),
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
