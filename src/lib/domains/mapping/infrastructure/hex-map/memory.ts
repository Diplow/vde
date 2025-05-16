import {
  type MapAttrs,
  type MapRelatedItems,
  type MapRelatedLists,
  type HexMapIdr,
  type MapWithId,
} from "~/lib/domains/mapping/_objects";
import { MapRepository } from "~/lib/domains/mapping/_repositories";
import { GenericAggregateMemoryRepository } from "~/lib/infrastructure/common/generic-repositories/memory";

export class MapMemoryRepository
  extends GenericAggregateMemoryRepository<
    MapAttrs,
    MapRelatedItems,
    MapRelatedLists,
    MapWithId,
    HexMapIdr
  >
  implements MapRepository
{
  async getByOwnerId({ ownerId }: { ownerId: number }) {
    return this.getByField({
      fields: {
        attrs: {
          ownerId,
        },
      },
    });
  }
}
