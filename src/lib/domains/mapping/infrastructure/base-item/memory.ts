import {
  BaseItemRelatedItems,
  BaseItemRelatedLists,
  type BaseItemAttrs,
  type BaseItemIdr,
  type BaseItemWithId,
} from "~/lib/domains/mapping/_objects";
import { BaseItemRepository } from "~/lib/domains/mapping/_repositories";
import { GenericAggregateMemoryRepository } from "~/lib/infrastructure/common/generic-repositories/memory";

export class BaseItemMemoryRepository
  extends GenericAggregateMemoryRepository<
    BaseItemAttrs,
    BaseItemRelatedItems,
    BaseItemRelatedLists,
    BaseItemWithId,
    BaseItemIdr
  >
  implements BaseItemRepository {}
