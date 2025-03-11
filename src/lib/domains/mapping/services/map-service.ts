import type { MapRepository } from "~/lib/domains/mapping/repositories";
import { MapActions } from "~/lib/domains/mapping/actions";
import { adapters, MapContract } from "~/lib/domains/mapping/adapters";
import { MapAggregate } from "~/lib/domains/mapping/objects";

export const MapService = (repository: MapRepository) => {
  const actions = MapActions(repository);

  const getOne = async (mapId: string): Promise<MapContract> => {
    return adapters.map(await actions.getOne(validateAndParseId(mapId)));
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
      ownerId,
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
    dimensions?: {
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapContract> => {
    MapAggregate.validateName(name);

    const map = await actions.create(
      name,
      description,
      { id: ownerId },
      dimensions,
    );

    return adapters.map(map);
  };

  const update = async (
    mapId: string,
    data: {
      name?: string;
      description?: string | null;
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapContract> => {
    validateUpdateDataIsNotEmpty(data);

    if (data.name) {
      MapAggregate.validateName(data.name);
    }

    return adapters.map(await actions.update(validateAndParseId(mapId), data));
  };

  const remove = async (mapId: string): Promise<void> => {
    await actions.remove(validateAndParseId(mapId));
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
  rows?: number;
  columns?: number;
  baseSize?: number;
}) => {
  if (
    !data.name &&
    data.description === undefined &&
    data.rows === undefined &&
    data.columns === undefined &&
    data.baseSize === undefined
  ) {
    throw new Error("No update data provided");
  }
};
