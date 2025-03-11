import type { MapRepository } from "~/lib/domains/mapping/repositories";
import { MapActions } from "~/lib/domains/mapping/actions";
import { adapters, MapContract } from "~/lib/domains/mapping/services/adapters";
import { MapAggregate } from "~/lib/domains/mapping/objects";

export class MapService {
  private readonly actions: MapActions;

  constructor(private readonly repository: MapRepository) {
    this.actions = new MapActions(repository);
  }

  public async getOne(mapId: string): Promise<MapContract> {
    const numericId = MapService.validateAndParseId(mapId);
    return adapters.map(await this.actions.getOne(numericId));
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> {
    const params = MapService.validatePaginationParameters(limit, offset);
    const maps = await this.repository.getMany(params.limit, params.offset);
    return maps.map(adapters.map);
  }

  public async getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<MapContract[]> {
    const params = MapService.validatePaginationParameters(limit, offset);
    const maps = await this.repository.getByOwnerId(
      ownerId,
      params.limit,
      params.offset,
    );
    return maps.map(adapters.map);
  }

  public async create(
    name: string,
    description: string | null,
    ownerId: string,
    dimensions?: {
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapContract> {
    MapAggregate.validateName(name);

    const map = await this.actions.create(
      name,
      description,
      { id: ownerId },
      dimensions,
    );
    return adapters.map(map);
  }

  public async update(
    mapId: string,
    data: {
      name?: string;
      description?: string | null;
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapContract> {
    MapService.validateUpdateDataIsNotEmpty(data);

    if (data.name) {
      MapAggregate.validateName(data.name);
    }

    const numericId = MapService.validateAndParseId(mapId);
    return adapters.map(await this.actions.update(numericId, data));
  }

  public async remove(mapId: string): Promise<void> {
    const numericId = MapService.validateAndParseId(mapId);
    await this.actions.remove(numericId);
  }

  private static validateAndParseId(id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error("Invalid ID: must be a positive number");
    }
    return numericId;
  }

  private static validatePaginationParameters(limit?: number, offset?: number) {
    return {
      limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
      offset: offset && offset >= 0 ? offset : 0,
    };
  }

  private static validateUpdateDataIsNotEmpty(data: {
    name?: string;
    description?: string | null;
    rows?: number;
    columns?: number;
    baseSize?: number;
  }) {
    if (
      !data.name &&
      data.description === undefined &&
      data.rows === undefined &&
      data.columns === undefined &&
      data.baseSize === undefined
    ) {
      throw new Error("No update data provided");
    }
  }
}
