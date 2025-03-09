import { MapRepository } from "~/lib/domains/mapping/repositories";
import { MapActions } from "~/lib/domains/mapping/actions";
import { adapters, MapContract } from "~/lib/domains/mapping/adapters";
import { OwnerEntity } from "./entities";

export const ServiceMap = (repository: MapRepository) => {
  const actions = MapActions(repository);

  const getOne = async (id: string): Promise<MapContract> => {
    const map = await actions.getOne(validateAndParseId(id));
    return adapters.map(map);
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

    return maps.map(adapters.map);
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

    return maps.map(adapters.map);
  };

  const create = async (
    name: string,
    description: string | null,
    ownerId: string,
  ): Promise<MapContract> => {
    const map = await actions.create(name, description, {
      id: validateAndParseId(ownerId),
    });

    return adapters.map(map);
  };

  const update = async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapContract> => {
    validateUpdateDataIsNotEmpty(data);
    const updatedMap = await actions.update(validateAndParseId(id), data);
    return adapters.map(updatedMap);
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

const validateUpdateDataIsNotEmpty = (data: {
  name?: string;
  description?: string | null;
}) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error("No update data provided");
  }
};
