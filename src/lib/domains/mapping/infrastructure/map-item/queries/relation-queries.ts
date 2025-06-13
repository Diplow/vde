import type {
  MapItemIdr,
  MapItemWithId,
  RelatedItems,
  RelatedLists,
} from "~/lib/domains/mapping/_objects/map-item";

export class RelationQueries {
  async updateRelatedItem<K extends keyof RelatedItems>(args: {
    aggregate: MapItemWithId;
    key: K;
    item: RelatedItems[K];
  }): Promise<void> {
    console.warn("updateRelatedItem args:", args);
    throw new Error(
      `updateRelatedItem not implemented directly for key: ${String(args.key)}. Use main update methods.`,
    );
  }

  async updateRelatedItemByIdr<K extends keyof RelatedItems>(args: {
    idr: MapItemIdr;
    key: K;
    item: RelatedItems[K];
  }): Promise<void> {
    console.warn("updateRelatedItemByIdr args:", args);
    throw new Error(
      `updateRelatedItemByIdr not implemented directly for key: ${String(args.key)}. Use main update methods.`,
    );
  }

  async addToRelatedList<K extends keyof RelatedLists>(args: {
    aggregate: MapItemWithId;
    key: K;
    item: RelatedLists[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<void> {
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly add to 'neighbors' list via update. Create a new MapItem with the correct parentId.",
      );
    }
    throw new Error(
      `addToRelatedList not implemented for key: ${String(args.key)}`,
    );
  }

  async addToRelatedListByIdr<K extends keyof RelatedLists>(args: {
    idr: MapItemIdr;
    key: K;
    item: RelatedLists[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<void> {
    console.warn("addToRelatedListByIdr args:", args);
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly add to 'neighbors' list via update. Create a new MapItem with the correct parentId.",
      );
    }
    throw new Error(
      `addToRelatedListByIdr not implemented for key: ${String(args.key)}`,
    );
  }

  async removeFromRelatedList<K extends keyof RelatedLists>(args: {
    aggregate: MapItemWithId;
    key: K;
    itemId: number;
  }): Promise<void> {
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly remove from 'neighbors' list via update. Delete the child MapItem or update its parentId.",
      );
    }
    throw new Error(
      `removeFromRelatedList not implemented for key: ${String(args.key)}`,
    );
  }

  async removeFromRelatedListByIdr<K extends keyof RelatedLists>(args: {
    idr: MapItemIdr;
    key: K;
    itemId: number;
  }): Promise<void> {
    console.warn("removeFromRelatedListByIdr args:", args);
    if (args.key === "neighbors") {
      throw new Error(
        "Cannot directly remove from 'neighbors' list via update. Delete the child MapItem or update its parentId.",
      );
    }
    throw new Error(
      `removeFromRelatedListByIdr not implemented for key: ${String(args.key)}`,
    );
  }
}
