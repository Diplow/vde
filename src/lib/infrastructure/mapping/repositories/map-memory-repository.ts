import {
  MapAggregate,
  MapAttributes,
  MapItemEntity,
  OwnerEntity,
  OwnerEntityAttributes,
} from "~/lib/domains/mapping/entities";
import { MapRepository } from "~/lib/domains/mapping/repositories";
import { GenericAggregateMemoryRepository } from "~/lib/infrastructure/common/generic-memory-repository";
import { GenericAggregate } from "~/lib/domains/utils/entities";

export class MapAggregateRepository implements MapRepository {
  private repository: GenericAggregateMemoryRepository<
    MapAttributes,
    MapAggregate
  >;

  constructor() {
    this.repository = new GenericAggregateMemoryRepository<
      MapAttributes,
      MapAggregate
    >(
      class extends MapAggregate {
        constructor(
          data: MapAttributes,
          relatedItems: Record<string, GenericAggregate>,
          relatedLists: Record<string, GenericAggregate[]>,
        ) {
          super(
            data,
            relatedItems.owner as OwnerEntity,
            relatedLists.items as MapItemEntity[],
          );
        }
      },
    );
  }

  async getOne(mapId: number): Promise<MapAggregate> {
    return await this.repository.getOne(mapId);
  }

  async getMany(limit?: number, offset?: number): Promise<MapAggregate[]> {
    return await this.repository.getMany(limit, offset);
  }

  async getByOwnerId(
    ownerId: number,
    limit?: number,
    offset?: number,
  ): Promise<MapAggregate[]> {
    return await this.repository.getByRelatedItem(
      "owner",
      ownerId,
      limit,
      offset,
    );
  }

  async create(
    name: string,
    description: string | null,
    owner: OwnerEntityAttributes,
  ): Promise<MapAggregate> {
    return await this.repository.create(
      {
        name,
        description,
      },
      { owner: new OwnerEntity(owner) },
      { items: [] },
    );
  }

  async update(
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapAggregate> {
    return await this.repository.update(mapId, data);
  }

  async addItem(mapId: number, item: MapItemEntity): Promise<MapAggregate> {
    return await this.repository.addToRelatedList(mapId, "items", item);
  }

  async removeItem(mapId: number, itemId: number): Promise<MapAggregate> {
    return await this.repository.removeFromRelatedList(mapId, "items", itemId);
  }

  async remove(mapId: number): Promise<void> {
    await this.repository.remove(mapId);
  }

  reset(): void {
    this.repository.reset();
  }
}
