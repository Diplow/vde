import {
  MapAggregate,
  MapAttributes,
  MapItemAggregate,
  MapItemReference,
  MapItemType,
  OwnerEntity,
  OwnerAttributes,
} from "~/lib/domains/mapping/objects";
import { MapRepository } from "~/lib/domains/mapping/repositories";
import { GenericAggregateMemoryRepository } from "~/lib/infrastructure/common/generic-memory-repository";
import { GenericAggregate } from "~/lib/domains/utils/generic-objects";
import { HexCoordinate } from "~/lib/hex-coordinates";

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
            relatedLists.items as MapItemAggregate[],
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
    ownerId: string,
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
    owner: OwnerAttributes,
    rows?: number,
    columns?: number,
    baseSize?: number,
  ): Promise<MapAggregate> {
    return await this.repository.create(
      {
        name,
        description,
        rows: rows ?? 10,
        columns: columns ?? 10,
        baseSize: baseSize ?? 50,
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
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapAggregate> {
    return await this.repository.update(mapId, data);
  }

  async addItem(
    mapId: number,
    coordinates: HexCoordinate,
    reference: MapItemReference,
    ownerId: string,
  ): Promise<MapItemAggregate> {
    // Validate the coordinates and reference
    MapItemAggregate.validateCoordinates(coordinates);
    MapItemAggregate.validateReference(reference);

    // Create a new MapItemAggregate
    const item = new MapItemAggregate(
      {
        id: Date.now(), // Generate a unique ID based on timestamp
        mapId,
        coordinates,
        reference,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      new OwnerEntity({ id: ownerId }),
      [], // No related items initially
    );

    // Add the item to the map's items list
    await this.repository.addToRelatedList(mapId, "items", item);

    return item;
  }

  async removeItem(mapId: number, reference: MapItemReference): Promise<void> {
    // Validate the reference
    MapItemAggregate.validateReference(reference);

    // Get the map with its items
    const map = await this.getOne(mapId);

    // Find the item to remove based on the reference
    const itemToRemove = map.items.find(
      (item) =>
        item.data.reference.id.toString() === reference.id.toString() &&
        item.data.reference.type === reference.type,
    );

    if (!itemToRemove) {
      throw new Error(
        `Map item with reference ID ${reference.id} and type ${reference.type} not found`,
      );
    }

    // Remove the item by its ID
    await this.repository.removeFromRelatedList(
      mapId,
      "items",
      itemToRemove.data.id,
    );
  }

  async remove(mapId: number): Promise<void> {
    await this.repository.remove(mapId);
  }

  reset(): void {
    this.repository.reset();
  }
}
