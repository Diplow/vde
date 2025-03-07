import type { MapRepository } from "~/lib/domains/mapping/repositories";
import type { MapEntity } from "~/lib/domains/mapping/entities";

export const MapActions = (repository: MapRepository) => {
  const getOne = async (mapId: number): Promise<MapEntity> => {
    return await repository.getOne(mapId);
  };

  const getMany = async (
    limit?: number,
    offset?: number,
  ): Promise<MapEntity[]> => {
    return await repository.getMany(limit, offset);
  };

  const getByOwnerId = async (
    ownerId: number,
    limit?: number,
    offset?: number,
  ): Promise<MapEntity[]> => {
    return await repository.getByOwnerId(ownerId, limit, offset);
  };

  const create = async (
    name: string,
    description: string | null,
    ownerId: number,
    ownerType: string,
  ): Promise<MapEntity> => {
    return await repository.create(name, description, ownerId, ownerType);
  };

  const update = async (
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapEntity> => {
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
