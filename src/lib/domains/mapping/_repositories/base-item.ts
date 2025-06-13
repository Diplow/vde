import {
  type BaseItemWithId,
  type BaseItemAttrs,
  type BaseItemIdr,
  type BaseItemRelatedItems,
  type BaseItemRelatedLists,
} from "~/lib/domains/mapping/_objects";
import { type GenericRepository } from "~/lib/domains/utils/generic-repository";

export type BaseItemRepository = GenericRepository<
  BaseItemAttrs,
  BaseItemRelatedItems,
  BaseItemRelatedLists,
  BaseItemWithId,
  BaseItemIdr
>;
