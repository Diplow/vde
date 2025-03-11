import type { MapRepository } from "~/lib/domains/mapping/repositories";
import type {
  MapAggregate as MapAggregateObject,
  OwnerEntityAttributes as OwnerEntityAttributesObject,
} from "~/lib/domains/mapping/objects";

export const MapActions = (repository: MapRepository) => {
  const getOne = async (mapId: number): Promise<MapAggregateObject> => {
    return await repository.getOne(mapId);
  };

  const getMany = async (
    limit?: number,
    offset?: number,
  ): Promise<MapAggregateObject[]> => {
    return await repository.getMany(limit, offset);
  };

  const getByOwnerId = async (
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<MapAggregateObject[]> => {
    return await repository.getByOwnerId(ownerId, limit, offset);
  };

  const create = async (
    name: string,
    description: string | null,
    owner: OwnerEntityAttributesObject,
    dimensions?: {
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapAggregateObject> => {
    return await repository.create(name, description, owner, dimensions);
  };

  const update = async (
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapAggregateObject> => {
    return await repository.update(mapId, data);
  };

  const remove = async (mapId: number): Promise<void> => {
    await repository.remove(mapId);
  };

  return {
    getOne,
    getMany,
    getByOwnerId,
    create,
    update,
    remove,
  };
}; 