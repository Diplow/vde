import { MapEntity, MapAttributes } from "~/lib/domains/mapping/entities";
import { MapRepository } from "~/lib/domains/mapping/repositories";

export class MapMemoryRepository implements MapRepository {
  private maps: Map<number, MapAttributes> = new Map();
  private idCounter: number = 1;

  async getOne(mapId: number): Promise<MapEntity> {
    const map = this.maps.get(mapId);
    if (!map) {
      throw new Error(`Map with ID ${mapId} not found`);
    }
    return new MapEntity(map);
  }

  async getMany(limit = 50, offset = 0): Promise<MapEntity[]> {
    const maps = Array.from(this.maps.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(offset, offset + limit);

    return maps.map((map) => new MapEntity(map));
  }

  async getByOwnerId(
    ownerId: number,
    limit = 50,
    offset = 0,
  ): Promise<MapEntity[]> {
    const maps = Array.from(this.maps.values())
      .filter((map) => map.ownerId === ownerId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(offset, offset + limit);

    return maps.map((map) => new MapEntity(map));
  }

  async create(
    name: string,
    description: string | null,
    ownerId: number,
    ownerType: string,
  ): Promise<MapEntity> {
    const id = this.idCounter++;
    const now = new Date();

    const map: MapAttributes = {
      id,
      name,
      description,
      ownerId,
      ownerType: ownerType as "user",
      createdAt: now,
      updatedAt: now,
    };

    this.maps.set(id, map);
    return new MapEntity(map);
  }

  async update(
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapEntity> {
    const map = this.maps.get(mapId);
    if (!map) {
      throw new Error(`Map with ID ${mapId} not found`);
    }

    const updatedMap = {
      ...map,
      ...data,
      updatedAt: new Date(),
    };

    this.maps.set(mapId, updatedMap);
    return new MapEntity(updatedMap);
  }

  async remove(mapId: number): Promise<void> {
    if (!this.maps.has(mapId)) {
      throw new Error(`Map with ID ${mapId} not found`);
    }

    this.maps.delete(mapId);
  }

  reset(): void {
    this.maps.clear();
    this.idCounter = 1;
  }
}
