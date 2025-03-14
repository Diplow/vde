import {
  MapAggregate,
  OwnerAttributes,
  MapItemAggregate,
  MapItemReference,
  MapItemAttributes,
} from "~/lib/domains/mapping/objects";
import { HexCoordinate } from "~/lib/hex-coordinates";

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
    owner: OwnerAttributes,
    rows?: number,
    columns?: number,
    baseSize?: number,
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

  /**
   * Add an item to a map
   */
  addItem(
    mapId: number,
    coordinates: HexCoordinate,
    reference: MapItemReference,
    ownerId: string,
  ): Promise<MapItemAggregate>;

  /**
   * Remove an item from a map
   */
  removeItem(mapId: number, reference: MapItemReference): Promise<void>;
}
