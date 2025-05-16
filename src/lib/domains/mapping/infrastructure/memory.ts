import { type GenericHistory } from "~/lib/domains/utils/generic-objects";
import {
  BaseItem,
  BaseItemAttrs,
  BaseItemRelatedItems,
  BaseItemRelatedLists,
  BaseItemWithId,
  HexMap,
  MapAttrs,
  MapItem,
  MapItemAttrs,
  MapItemRelatedItems,
  MapItemRelatedLists,
  MapItemWithId,
  MapRelatedItems,
  MapRelatedLists,
  MapWithId,
} from "../_objects";
import { MapMemoryRepository } from "./hex-map";
import { AggregateConstructor } from "~/lib/infrastructure/common/generic-repositories/memory";
import { MapItemMemoryRepository } from "./map-item/memory";
import { BaseItemMemoryRepository } from "./base-item/memory";

export const declareMappingMemoryRepositories = () => {
  const mapRepo = new MapMemoryRepository(
    class extends HexMap {
      constructor({
        id,
        history,
        attrs,
        relatedItems,
        relatedLists,
      }: {
        id: number;
        history: GenericHistory;
        attrs: MapAttrs;
        relatedItems: MapRelatedItems;
        relatedLists: MapRelatedLists;
      }) {
        super({
          id,
          history,
          attrs,
          relatedItems,
          relatedLists,
          items: relatedLists?.items,
          center: relatedItems?.center,
        });
      }
    } as unknown as AggregateConstructor<
      MapAttrs,
      MapRelatedItems,
      MapRelatedLists,
      MapWithId
    >,
  );
  const mapItemRepo = new MapItemMemoryRepository(
    class extends MapItem {
      constructor({
        id,
        history,
        attrs,
        relatedItems,
        relatedLists,
      }: {
        id: number;
        history: GenericHistory;
        attrs: MapItemAttrs;
        relatedItems: MapItemRelatedItems;
        relatedLists: MapItemRelatedLists;
      }) {
        super({
          id,
          history,
          attrs: {
            ...attrs,
            mapId: attrs.mapId ?? id,
          },
          relatedItems,
          relatedLists,
          ref: relatedItems?.ref,
          neighbors: relatedLists?.neighbors,
          origin: relatedItems?.origin,
          parent: relatedItems?.parent,
        });
      }
    } as unknown as AggregateConstructor<
      MapItemAttrs,
      MapItemRelatedItems,
      MapItemRelatedLists,
      MapItemWithId
    >,
  );
  const baseItemRepo = new BaseItemMemoryRepository(
    class extends BaseItem {
      constructor({
        id,
        history,
        attrs,
        relatedItems,
        relatedLists,
      }: {
        id: number;
        history: GenericHistory;
        attrs: BaseItemAttrs;
        relatedItems: BaseItemRelatedItems;
        relatedLists: BaseItemRelatedLists;
      }) {
        super({
          id,
          history,
          attrs,
          relatedItems,
          relatedLists,
        });
      }
    } as unknown as AggregateConstructor<
      BaseItemAttrs,
      BaseItemRelatedItems,
      BaseItemRelatedLists,
      BaseItemWithId
    >,
  );

  return {
    map: mapRepo,
    mapItem: mapItemRepo,
    baseItem: baseItemRepo,
  };
};
