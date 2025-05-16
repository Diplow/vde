import {
  BaseItemWithId,
  type BaseItemAttrs,
  type BaseItemIdr,
  type BaseItemRelatedItems,
  type BaseItemRelatedLists,
} from "~/lib/domains/mapping/_objects";
import { GenericRepository } from "~/lib/domains/utils/generic-repository";

export interface BaseItemRepository
  extends GenericRepository<
    BaseItemAttrs,
    BaseItemRelatedItems,
    BaseItemRelatedLists,
    BaseItemWithId,
    BaseItemIdr
  > {}
