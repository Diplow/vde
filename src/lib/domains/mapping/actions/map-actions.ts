import type { MapRepository } from "~/lib/domains/mapping/repositories";
import type {
  MapAggregate as MapAggregateObject,
  OwnerEntityAttributes as OwnerEntityAttributesObject,
} from "~/lib/domains/mapping/objects";

export class MapActions {
  private readonly repository: MapRepository;

  constructor(repository: MapRepository) {
    this.repository = repository;
  }

  public async getOne(mapId: number): Promise<MapAggregateObject> {
    return await this.repository.getOne(mapId);
  }

  public async getMany(
    limit?: number,
    offset?: number,
  ): Promise<MapAggregateObject[]> {
    return await this.repository.getMany(limit, offset);
  }

  public async getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<MapAggregateObject[]> {
    return await this.repository.getByOwnerId(ownerId, limit, offset);
  }

  public async create(
    name: string,
    description: string | null,
    owner: OwnerEntityAttributesObject,
    dimensions?: {
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapAggregateObject> {
    return await this.repository.create(name, description, owner, dimensions);
  }

  public async update(
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapAggregateObject> {
    return await this.repository.update(mapId, data);
  }

  public async remove(mapId: number): Promise<void> {
    await this.repository.remove(mapId);
  }
}
