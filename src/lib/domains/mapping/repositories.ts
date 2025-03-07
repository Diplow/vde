import type { MapEntity } from "~/lib/domains/mapping/entities";

export interface MapRepository {
  getOne(mapId: number): Promise<MapEntity>;
  getMany(limit?: number, offset?: number): Promise<MapEntity[]>;
  getByOwnerId(
    ownerId: number,
    limit?: number,
    offset?: number,
  ): Promise<MapEntity[]>;
  create(
    name: string,
    description: string | null,
    ownerId: number,
    ownerType: string,
  ): Promise<MapEntity>;
  update(
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapEntity>;
  remove(mapId: number): Promise<void>;
}
