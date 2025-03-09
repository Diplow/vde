import type {
  MapAggregate,
  OwnerEntityAttributes,
} from "~/lib/domains/mapping/entities";

export interface MapRepository {
  getOne(mapId: number): Promise<MapAggregate>;
  getMany(limit?: number, offset?: number): Promise<MapAggregate[]>;
  getByOwnerId(
    ownerId: number,
    limit?: number,
    offset?: number,
  ): Promise<MapAggregate[]>;
  create(
    name: string,
    description: string | null,
    owner: OwnerEntityAttributes,
  ): Promise<MapAggregate>;
  update(
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
    },
  ): Promise<MapAggregate>;
  remove(mapId: number): Promise<void>;
}
