import type {
  MapAttrs,
  HexMapIdr,
  MapWithId,
  MapRelatedItems,
  MapRelatedLists,
} from "~/lib/domains/mapping/_objects";
import { GenericRepository } from "../../utils/generic-repository";

export interface MapRepository
  extends GenericRepository<
    MapAttrs,
    MapRelatedItems,
    MapRelatedLists,
    MapWithId,
    HexMapIdr
  > {
  getByOwnerId({
    ownerId,
    limit,
    offset,
  }: {
    ownerId: string;
    limit: number;
    offset: number;
  }): Promise<MapWithId[]>;
}
