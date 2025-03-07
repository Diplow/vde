import { MapEntity, MapAttributes } from "~/lib/domains/mapping/entities";
import { MapRepository } from "~/lib/domains/mapping/repositories";
import { GenericMemoryRepository } from "~/lib/infrastructure/common/generic-memory-repository";

/**
 * Implementation of MapRepository using the generic memory repository
 */
export class MapMemoryRepositoryGeneric implements MapRepository {
  private repository: GenericMemoryRepository<MapAttributes, MapEntity>;

  constructor() {
    this.repository = new GenericMemoryRepository<MapAttributes, MapEntity>(
      MapEntity,
    );
  }

  async getOne(mapId: number): Promise<MapEntity> {
    return await this.repository.getOne(mapId);
  }

  async getMany(limit?: number, offset?: number): Promise<MapEntity[]> {
    return await this.repository.getMany(limit, offset);
  }

  async getByOwnerId(
    ownerId: number,
    limit?: number,
    offset?: number,
  ): Promise<MapEntity[]> {
    return await this.repository.getByField("ownerId", ownerId, limit, offset);
  }

  async create(
    name: string,
    description: string | null,
    ownerId: number,
    ownerType: string,
  ): Promise<MapEntity> {
    return await this.repository.create({
      name,
      description,
      ownerId,
      ownerType: ownerType as "user",
    });
  }

  async update(
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapEntity> {
    return await this.repository.update(mapId, data);
  }

  async remove(mapId: number): Promise<void> {
    await this.repository.remove(mapId);
  }

  reset(): void {
    this.repository.reset();
  }
}
