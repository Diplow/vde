import {
  MapAggregate,
  OwnerEntityAttributes,
} from "~/lib/domains/mapping/objects";

export interface MapRepository {
  getOne(mapId: number): Promise<MapAggregate>;
  getMany(limit?: number, offset?: number): Promise<MapAggregate[]>;
  getByOwnerId(
    ownerId: string,
    limit?: number,
    offset?: number,
  ): Promise<MapAggregate[]>;
  create(
    name: string,
    description: string | null,
    owner: OwnerEntityAttributes,
    dimensions?: {
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapAggregate>;
  update(
    mapId: number,
    data: {
      name?: string;
      description?: string | null;
      rows?: number;
      columns?: number;
      baseSize?: number;
    },
  ): Promise<MapAggregate>;
  remove(mapId: number): Promise<void>;
}
