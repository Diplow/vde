import { GenericAggregate } from "~/lib/domains/utils/generic-objects";

/**
 * Generic attributes interface with required ID and timestamps
 */
export interface GenericAttributes {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

/**
 * Type for aggregate constructor
 */
export type AggregateConstructor<
  T extends GenericAttributes,
  A extends GenericAggregate,
> = new (
  data: T,
  relatedItems: Record<string, GenericAggregate>,
  relatedLists: Record<string, Array<GenericAggregate>>,
) => A;

/**
 * Generic memory repository for aggregates
 */
export class GenericAggregateMemoryRepository<
  T extends GenericAttributes,
  A extends GenericAggregate,
> {
  private entities: Map<number, T> = new Map();
  private relatedItems: Map<number, Record<string, GenericAggregate>> =
    new Map();
  private relatedLists: Map<number, Record<string, Array<GenericAggregate>>> =
    new Map();
  private idCounter: number = 1;
  private aggregateConstructor: AggregateConstructor<T, A>;

  constructor(aggregateConstructor: AggregateConstructor<T, A>) {
    this.aggregateConstructor = aggregateConstructor;
    this.entities = new Map();
    this.relatedItems = new Map();
    this.relatedLists = new Map();
    this.idCounter = 1;
  }

  /**
   * Get an aggregate by ID
   */
  async getOne(id: number): Promise<A> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const items = this.relatedItems.get(id) || {};
    const lists = this.relatedLists.get(id) || {};

    return new this.aggregateConstructor(entity, items, lists);
  }

  /**
   * Get multiple aggregates with pagination
   */
  async getMany(limit = 50, offset = 0): Promise<A[]> {
    const entityIds = Array.from(this.entities.keys())
      .sort((a, b) => {
        const entityA = this.entities.get(a);
        const entityB = this.entities.get(b);
        if (!entityA || !entityB) return 0;
        return entityA.createdAt.getTime() - entityB.createdAt.getTime();
      })
      .slice(offset, offset + limit);

    return Promise.all(entityIds.map((id) => this.getOne(id)));
  }

  /**
   * Get aggregates by a field value
   */
  async getByField(
    fieldName: keyof T,
    value: any,
    limit = 50,
    offset = 0,
  ): Promise<A[]> {
    const entityIds = Array.from(this.entities.entries())
      .filter(([_, entity]) => entity[fieldName] === value)
      .map(([id]) => id)
      .sort((a, b) => {
        const entityA = this.entities.get(a);
        const entityB = this.entities.get(b);
        if (!entityA || !entityB) return 0;
        return entityA.createdAt.getTime() - entityB.createdAt.getTime();
      })
      .slice(offset, offset + limit);

    return Promise.all(entityIds.map((id) => this.getOne(id)));
  }

  /**
   * Get aggregates by a related item
   */
  async getByRelatedItem(
    relatedItemKey: string,
    itemId: number | string,
    limit = 50,
    offset = 0,
  ): Promise<A[]> {
    // Filter entities that have the specified related item
    const entityIds = Array.from(this.relatedItems.entries())
      .filter(([_, relatedItems]) => {
        const relatedItem = relatedItems[relatedItemKey];
        return (
          relatedItem &&
          relatedItem instanceof GenericAggregate &&
          relatedItem.data &&
          "id" in relatedItem.data &&
          relatedItem.data.id === itemId
        );
      })
      .map(([id]) => id)
      .sort((a, b) => {
        const entityA = this.entities.get(a);
        const entityB = this.entities.get(b);
        if (!entityA || !entityB) return 0;
        return entityB.createdAt.getTime() - entityA.createdAt.getTime(); // Newest first
      })
      // Apply pagination
      .slice(offset, offset + limit);

    return Promise.all(entityIds.map((id) => this.getOne(id)));
  }

  /**
   * Create a new aggregate
   */
  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    relatedItems: Record<string, GenericAggregate> = {},
    relatedLists: Record<string, Array<GenericAggregate>> = {},
  ): Promise<A> {
    const id = this.idCounter++;
    const now = new Date();

    const entity = {
      id,
      createdAt: now,
      updatedAt: now,
      ...data,
    } as T;

    this.entities.set(id, entity);
    this.relatedItems.set(id, relatedItems);
    this.relatedLists.set(id, relatedLists);

    return new this.aggregateConstructor(entity, relatedItems, relatedLists);
  }

  /**
   * Update an existing aggregate
   */
  async update(
    id: number,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
    relatedItems?: Record<string, GenericAggregate>,
    relatedLists?: Record<string, Array<GenericAggregate>>,
  ): Promise<A> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const now = new Date();
    if (now.getTime() === entity.updatedAt.getTime()) {
      now.setMilliseconds(now.getMilliseconds() + 1);
    }

    const updatedEntity = {
      ...entity,
      ...data,
      updatedAt: now,
    };

    this.entities.set(id, updatedEntity);

    if (relatedItems) {
      this.relatedItems.set(id, relatedItems);
    }

    if (relatedLists) {
      this.relatedLists.set(id, relatedLists);
    }

    return this.getOne(id);
  }

  /**
   * Update a related item
   */
  async updateRelatedItem(
    id: number,
    key: string,
    item: GenericAggregate,
  ): Promise<A> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const currentItems = this.relatedItems.get(id) || {};
    const newItems = { ...currentItems, [key]: item };

    this.relatedItems.set(id, newItems);

    return this.getOne(id);
  }

  /**
   * Add an item to a related list
   */
  async addToRelatedList(
    id: number,
    key: string,
    item: GenericAggregate,
  ): Promise<A> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const currentLists = this.relatedLists.get(id) || {};
    const currentList = currentLists[key] || [];
    const newList = [...currentList, item];

    this.relatedLists.set(id, { ...currentLists, [key]: newList });

    return this.getOne(id);
  }

  /**
   * Remove an item from a related list
   */
  async removeFromRelatedList(
    id: number,
    key: string,
    itemId: number,
  ): Promise<A> {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const currentLists = this.relatedLists.get(id) || {};
    const currentList = currentLists[key] || [];

    // Filter out the item with the matching ID
    const newList = currentList.filter((item) => {
      if (item instanceof GenericAggregate && item.data && "id" in item.data) {
        return item.data.id !== itemId;
      }
      return true;
    });

    this.relatedLists.set(id, { ...currentLists, [key]: newList });

    return this.getOne(id);
  }

  /**
   * Remove an aggregate
   */
  async remove(id: number): Promise<void> {
    if (!this.entities.has(id)) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    this.entities.delete(id);
    this.relatedItems.delete(id);
    this.relatedLists.delete(id);
  }

  /**
   * Reset the repository
   */
  reset(): void {
    this.entities.clear();
    this.relatedItems.clear();
    this.relatedLists.clear();
    this.idCounter = 1;
  }
}
