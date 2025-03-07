import { MapEntity } from "~/lib/domains/mapping/entities";
import { MapRepository } from "~/lib/domains/mapping/repositories";
import { MapActions } from "~/lib/domains/mapping/actions";

export interface MapContract {
  id: string; // Converting from number to string for the API
  name: string;
  description: string | null;
  ownerId: string;
  ownerType: string;
  createdAt: string; // ISO format for API
  updatedAt: string; // ISO format for API
}

export const ServiceMap = (repository: MapRepository) => {
  const actions = MapActions(repository);

  const adapt = (entity: MapEntity): MapContract => {
    return {
      id: String(entity.data.id),
      name: entity.data.name,
      description: entity.data.description,
      ownerId: String(entity.data.ownerId),
      ownerType: entity.data.ownerType,
      createdAt: entity.data.createdAt.toISOString(),
      updatedAt: entity.data.updatedAt.toISOString(),
    };
  };

  const getOne = async (id: string): Promise<MapContract> => {
    const map = await actions.getOne(validateAndParseId(id));
    return adapt(map);
  };

  const getMany = async (
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> => {
    const params = validatePaginationParameters(limit, offset);
    const maps = await actions.getMany(params.limit, params.offset);

    if (!maps || !Array.isArray(maps)) {
      return [];
    }

    return maps.map(adapt);
  };

  const getByOwnerId = async (
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> => {
    const params = validatePaginationParameters(limit, offset);
    const maps = await actions.getByOwnerId(
      validateAndParseId(ownerId),
      params.limit,
      params.offset,
    );

    if (!maps || !Array.isArray(maps)) {
      return [];
    }

    return maps.map(adapt);
  };

  const create = async (
    name: string,
    description: string | null,
    ownerId: string,
    ownerType: string,
  ): Promise<MapContract> => {
    const map = await actions.create(
      name,
      description,
      validateAndParseId(ownerId),
      ownerType,
    );

    return adapt(map);
  };

  const update = async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapContract> => {
    assertUpdateDataIsNotEmpty(data);
    const updatedMap = await actions.update(validateAndParseId(id), data);
    return adapt(updatedMap);
  };

  const remove = async (id: string): Promise<void> => {
    await actions.remove(validateAndParseId(id));
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

const validateAndParseId = (id: string) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new Error("Invalid ID: must be a positive number");
  }
  return numericId;
};

const validatePaginationParameters = (limit?: number, offset?: number) => {
  return {
    limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
    offset: offset && offset >= 0 ? offset : 0,
  };
};

const assertUpdateDataIsNotEmpty = (data: {
  name?: string;
  description?: string | null;
}) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("No update data provided");
  }
};
