import type { MapRepository } from "~/lib/domains/mapping/repositories";
import type {
  MapAggregate,
  OwnerEntityAttributes,
} from "~/lib/domains/mapping/entities";

export const MapActions = (repository: MapRepository) => {
  const getOne = async (mapId: number): Promise<MapAggregate> => {
    return await repository.getOne(mapId);
  };

  const getMany = async (
    limit?: number,
    offset?: number,
  ): Promise<MapAggregate[]> => {
    return await repository.getMany(limit, offset);
  };

  const getByOwnerId = async (
    ownerId: number,
    limit?: number,
    offset?: number,
  ): Promise<MapAggregate[]> => {
    return await repository.getByOwnerId(ownerId, limit, offset);
  };

  const create = async (
    name: string,
    description: string | null,
    owner: OwnerEntityAttributes,
  ): Promise<MapAggregate> => {
    return await repository.create(name, description, owner);
  };

  const update = async (
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapAggregate> => {
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
