import {
  type MapItemAttrs,
  type MapItemIdr,
  type MapItemRelatedItems,
  type MapItemRelatedLists,
  type MapItemWithId,
} from "~/lib/domains/mapping/_objects";
import { MapItemRepository } from "~/lib/domains/mapping/_repositories";
import { GenericAggregateMemoryRepository } from "~/lib/infrastructure/common/generic-repositories/memory";

export class MapItemMemoryRepository
  extends GenericAggregateMemoryRepository<
    MapItemAttrs,
    MapItemRelatedItems,
    MapItemRelatedLists,
    MapItemWithId,
    MapItemIdr
  >
  implements MapItemRepository
{
  constructor(aggregateConstructor: any) {
    super(aggregateConstructor);
    // Add uniqueness constraint for mapId + coords
    this.addUniqueConstraint(
      ["attrs.mapId", "attrs.coords"],
      "A map item already exists at these coords",
    );
  }

  async remove(id: number): Promise<void> {
    super.remove(id);
  }
}
