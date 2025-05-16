import {
  GenericAggregate,
  GenericAttributes,
  GenericHistory,
  GenericRelatedItems,
  GenericRelatedLists,
} from "~/lib/domains/utils/generic-objects";
import { GenericRepository } from "~/lib/domains/utils/generic-repository";

type UniqueConstraint = {
  fields: string[];
  errorMessage: string;
};

type UniqueKeyMap = {
  fields: string[];
  map: Map<string, number>;
};

/**
 * Type for aggregate constructor
 */
export type AggregateConstructor<
  A extends GenericAttributes,
  I extends GenericRelatedItems,
  L extends GenericRelatedLists,
  T extends GenericAggregate<A, I, L>,
> = new ({
  id,
  history,
  attrs,
  relatedItems,
  relatedLists,
}: {
  id: number;
  history: GenericHistory;
  attrs: A;
  relatedItems: I;
  relatedLists: L;
}) => T & { id: number };

/**
 * Generic memory repository for aggregates
 */
export class GenericAggregateMemoryRepository<
  A extends GenericAttributes,
  I extends GenericRelatedItems,
  L extends GenericRelatedLists,
  T extends GenericAggregate<A, I, L> & { id: number },
  AggregateIdrType extends Partial<{
    id: number;
    attrs: Partial<A>;
    relatedItems: Partial<I>;
    relatedLists: Partial<L>;
  }>,
> implements GenericRepository<A, I, L, T, AggregateIdrType>
{
  private aggregates: Map<number, T> = new Map();
  private relatedItems: Map<number, I> = new Map();
  private relatedLists: Map<number, L> = new Map();
  private idCounter: number = 1;
  private aggregateConstructor: AggregateConstructor<A, I, L, T>;
  private uniqueConstraints: UniqueConstraint[] = [];
  private uniqueKeyMaps: UniqueKeyMap[] = [];
  private aggregatesByUniqueConstraint: Map<string, Map<string, T>> = new Map();

  constructor(aggregateConstructor: AggregateConstructor<A, I, L, T>) {
    this.aggregateConstructor = aggregateConstructor;
    this.aggregates = new Map();
    this.relatedItems = new Map();
    this.relatedLists = new Map();
    this.idCounter = 1;
    this.uniqueConstraints = [];
    this.uniqueKeyMaps = [];
    this.aggregatesByUniqueConstraint = new Map();
  }

  public handleCascading(): boolean {
    return false;
  }

  protected addUniqueConstraint(fields: string[], errorMessage: string) {
    const constraintName = fields.join("-");
    this.uniqueConstraints.push({ fields, errorMessage });
    this.uniqueKeyMaps.push({ fields, map: new Map() });
    this.aggregatesByUniqueConstraint.set(constraintName, new Map());
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  }

  private getUniqueKey(aggregate: T | Object, fields: string[]): string {
    return fields
      .map((field) => JSON.stringify(this.getValueByPath(aggregate, field)))
      .join("-");
  }

  private checkUniqueConstraints(aggregate: T): void {
    for (let i = 0; i < this.uniqueConstraints.length; i++) {
      const constraint = this.uniqueConstraints[i]!;
      const constraintName = constraint.fields.join("-");
      const key = this.getUniqueKey(aggregate, constraint.fields);
      const constraintMap =
        this.aggregatesByUniqueConstraint.get(constraintName);

      if (!constraintMap) continue;

      const existingAggregate = constraintMap.get(key);
      if (existingAggregate && existingAggregate.id !== aggregate.id) {
        throw new Error(constraint.errorMessage);
      }
    }
  }

  private updateUniqueConstraintMaps(aggregate: T): void {
    for (const constraint of this.uniqueConstraints) {
      const constraintName = constraint.fields.join("-");
      const key = this.getUniqueKey(aggregate, constraint.fields);
      const constraintMap =
        this.aggregatesByUniqueConstraint.get(constraintName);
      if (constraintMap) {
        constraintMap.set(key, aggregate);
      }
    }
  }

  private removeFromUniqueConstraintMaps(aggregate: T): void {
    for (const constraint of this.uniqueConstraints) {
      const constraintName = constraint.fields.join("-");
      const key = this.getUniqueKey(aggregate, constraint.fields);
      const constraintMap =
        this.aggregatesByUniqueConstraint.get(constraintName);
      if (constraintMap) {
        constraintMap.delete(key);
      }
    }
  }

  /**
   * Get an aggregate by ID
   */
  async getOne(id: number) {
    const aggregate = this.aggregates.get(id);
    if (!aggregate) {
      throw new Error(`Aggregate with ID ${id} not found`);
    }

    const items = this.relatedItems.get(id) || {};
    const lists = this.relatedLists.get(id) || {};

    const history = aggregate.history;
    const attrs = aggregate.attrs;
    return new this.aggregateConstructor({
      id,
      history,
      attrs,
      relatedItems: items as I,
      relatedLists: lists as L,
    });
  }

  async getOneByIdr({ idr }: { idr: AggregateIdrType }): Promise<T> {
    const aggregates = await this.getByField({
      fields: idr,
    });
    if (aggregates.length === 0) {
      throw new Error(`Aggregate with idr ${JSON.stringify(idr)} not found`);
    }
    if (aggregates.length > 1) {
      throw new Error(
        `Multiple aggregates with idr ${JSON.stringify(idr)} found`,
      );
    }
    return aggregates[0] as T;
  }

  async getMany({
    limit = 50,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    const aggregateIds = Array.from(this.aggregates.keys())
      .sort((a, b) => {
        const aggregateA = this.aggregates.get(a);
        const aggregateB = this.aggregates.get(b);
        if (!aggregateA || !aggregateB) return 0;
        return (
          aggregateA.history.createdAt.getTime() -
          aggregateB.history.createdAt.getTime()
        );
      })
      .slice(offset, offset + limit);

    return Promise.all(aggregateIds.map((id) => this.getOne(id)));
  }

  async getManyByIdr({
    idrs,
    limit = 50,
    offset = 0,
  }: {
    idrs: AggregateIdrType[];
    limit?: number;
    offset?: number;
  }) {
    const aggregateIds = idrs.slice(offset, offset + limit);
    return Promise.all(aggregateIds.map((idr) => this.getOneByIdr({ idr })));
  }

  private filterByFields(
    aggregate: Record<string, any>,
    fields: Record<string, any>,
  ): boolean {
    return Object.entries(fields).every(([fieldName, value]): boolean => {
      // Check if the field exists in the aggregate
      if (!(fieldName in aggregate)) {
        return false;
      }

      if (Array.isArray(value)) {
        // Check if both arrays have the same length
        if (value.length !== aggregate[fieldName].length) {
          return false;
        }

        // Check if arrays have the same values in the same order
        return value.every((item, index) => {
          return item === aggregate[fieldName][index];
        });
      }

      // For nested objects, recursively check if they match
      if (
        typeof value === "object" &&
        value !== null &&
        typeof aggregate[fieldName] === "object"
      ) {
        return this.filterByFields(aggregate[fieldName], value);
      }

      // For primitive values, check for equality
      return aggregate[fieldName] === value;
    });
  }

  async getByField({
    fields,
    limit = 50,
    offset = 0,
  }: {
    fields: Object;
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    const uniqueConstraintMatch = await this.getByUniqueConstraint(fields);
    if (uniqueConstraintMatch.length > 0) {
      return uniqueConstraintMatch;
    }

    // Fallback to filtering if no matching unique constraint found
    const aggregateIds = Array.from(this.aggregates.entries())
      .filter(([_, aggregate]) => this.filterByFields(aggregate, fields))
      .map(([id]) => id)
      .sort((a, b) => {
        const aggregateA = this.aggregates.get(a);
        const aggregateB = this.aggregates.get(b);
        if (!aggregateA || !aggregateB) return 0;
        return (
          aggregateA.history.createdAt.getTime() -
          aggregateB.history.createdAt.getTime()
        );
      })
      .slice(offset, offset + limit);

    return Promise.all(aggregateIds.map((id) => this.getOne(id)));
  }

  private matchesConstraint(
    fields: Object,
    constraintFields: string[],
  ): boolean {
    return constraintFields.every((constraintField) => {
      const parts = constraintField.split(".");
      let value: any = fields;

      // Navigate through the object following the constraint path
      for (const part of parts) {
        if (!(part in value)) {
          return false;
        }
        value = value[part];
      }

      // If we got here, the path exists in the fields object
      return true;
    });
  }

  async getByUniqueConstraint(fields: Object): Promise<T[]> {
    for (const constraint of this.uniqueConstraints) {
      // Check if the fields object matches this constraint's structure
      if (this.matchesConstraint(fields, constraint.fields)) {
        const constraintName = constraint.fields.join("-");
        const constraintMap =
          this.aggregatesByUniqueConstraint.get(constraintName);
        if (constraintMap) {
          const key = this.getUniqueKey(fields, constraint.fields);
          const aggregate = constraintMap.get(key);
          return aggregate ? [aggregate] : [];
        }
      }
    }
    return [];
  }

  async getByRelatedItem({
    relatedItemKey,
    itemId,
    limit = 50,
    offset = 0,
  }: {
    relatedItemKey: keyof I;
    itemId: number;
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    const aggregateIds = Array.from(this.relatedItems.entries())
      .filter(([_, relatedItems]) => {
        const relatedItem = relatedItems[relatedItemKey];
        if (!relatedItem) return false;
        // typescript too stupid :(
        return (relatedItem as unknown as { id: number }).id === itemId;
      })
      .map(([id]) => id)
      .sort((a, b) => {
        const aggregateA = this.aggregates.get(a);
        const aggregateB = this.aggregates.get(b);
        if (!aggregateA || !aggregateB) return 0;
        return (
          aggregateB.history.createdAt.getTime() -
          aggregateA.history.createdAt.getTime()
        );
      })
      // Apply pagination
      .slice(offset, offset + limit);

    return Promise.all(aggregateIds.map((id) => this.getOne(id)));
  }

  async create({
    attrs,
    relatedItems,
    relatedLists,
  }: {
    attrs: A;
    relatedItems: I;
    relatedLists: L;
  }): Promise<T> {
    const id = this.idCounter++;
    const newAggregate = new this.aggregateConstructor({
      id,
      history: { createdAt: new Date(), updatedAt: new Date() },
      attrs: attrs,
      relatedItems,
      relatedLists,
    });

    // Check uniqueness constraints before creating
    this.checkUniqueConstraints(newAggregate);

    this.aggregates.set(id, newAggregate);
    this.relatedItems.set(id, relatedItems);
    this.relatedLists.set(id, relatedLists);

    // Update unique constraint maps
    this.updateUniqueConstraintMaps(newAggregate);

    return newAggregate as T;
  }

  async update({
    aggregate,
    attrs,
  }: {
    aggregate: T;
    attrs: Partial<A>;
  }): Promise<T> {
    const now = new Date();
    if (now.getTime() === aggregate.history.updatedAt.getTime()) {
      now.setMilliseconds(now.getMilliseconds() + 1);
    }

    // Remove old unique keys
    this.removeFromUniqueConstraintMaps(aggregate);

    const updatedEntity = {
      ...aggregate,
      attrs: {
        ...aggregate.attrs,
        ...attrs,
      },
      history: {
        ...aggregate.history,
        updatedAt: now,
      },
    };

    // Check uniqueness constraints before updating
    this.checkUniqueConstraints(updatedEntity as T);

    this.aggregates.set(aggregate.id, updatedEntity as T);

    // Update unique constraint maps
    this.updateUniqueConstraintMaps(updatedEntity as T);

    return updatedEntity as T;
  }

  async updateByIdr({
    idr,
    attrs,
  }: {
    idr: AggregateIdrType;
    attrs: Partial<A>;
  }): Promise<T> {
    const aggregate = await this.getOneByIdr({ idr });
    return this.update({
      aggregate,
      attrs,
    });
  }

  async updateRelatedItem({
    aggregate,
    key,
    item,
  }: {
    aggregate: T;
    key: keyof I;
    item: I[keyof I];
  }): Promise<T> {
    const currentItems = this.relatedItems.get(aggregate.id) || {};
    const newItems = { ...currentItems, [key]: item } as I;

    this.relatedItems.set(aggregate.id, newItems);

    return {
      ...aggregate,
      relatedItems: newItems,
    } as T;
  }

  async updateRelatedItemByIdr({
    idr,
    key,
    item,
  }: {
    idr: AggregateIdrType;
    key: keyof I;
    item: I[keyof I];
  }): Promise<T> {
    const aggregate = await this.getOneByIdr({ idr });
    return this.updateRelatedItem({
      aggregate,
      key,
      item,
    });
  }

  async addToRelatedList<K extends keyof L>({
    aggregate,
    key,
    item,
  }: {
    aggregate: T;
    key: K;
    item: L[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<T> {
    const currentLists = this.relatedLists.get(aggregate.id) || ({} as L);
    const currentList = Array.isArray(currentLists[key])
      ? currentLists[key]
      : ([] as L[K][]);
    const newList = [...currentList, item] as L[K][];

    this.relatedLists.set(aggregate.id, { ...currentLists, [key]: newList });

    return {
      ...aggregate,
      relatedLists: { ...currentLists, [key]: newList },
    } as T;
  }

  async addToRelatedListByIdr<K extends keyof L>({
    idr,
    key,
    item,
  }: {
    idr: AggregateIdrType;
    key: K;
    item: L[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<T> {
    const aggregate = await this.getOneByIdr({ idr });
    return this.addToRelatedList({
      aggregate,
      key,
      item,
    });
  }

  async removeFromRelatedList<K extends keyof L>({
    aggregate,
    key,
    itemId,
  }: {
    aggregate: T;
    key: K;
    itemId: number;
  }): Promise<T> {
    const currentLists = this.relatedLists.get(aggregate.id) || ({} as L);
    const currentList = Array.isArray(currentLists[key])
      ? currentLists[key]
      : ([] as L[K][]);

    // Filter out the item with the matching ID
    const newList = currentList.filter(
      (item: L[K] & { id: number }) => item.id !== itemId,
    );

    this.relatedLists.set(aggregate.id, { ...currentLists, [key]: newList });

    return {
      ...aggregate,
      relatedLists: { ...currentLists, [key]: newList },
    } as T;
  }

  async removeFromRelatedListByIdr<K extends keyof L>({
    idr,
    key,
    itemId,
  }: {
    idr: AggregateIdrType;
    key: K;
    itemId: number;
  }): Promise<T> {
    const aggregate = await this.getOneByIdr({ idr });
    return this.removeFromRelatedList({
      aggregate,
      key,
      itemId,
    });
  }

  async remove(id: number): Promise<void> {
    const aggregate = this.aggregates.get(id);
    if (!aggregate) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    // Remove from unique constraint maps before deleting
    this.removeFromUniqueConstraintMaps(aggregate);

    this.aggregates.delete(id);
    this.relatedItems.delete(id);
    this.relatedLists.delete(id);
  }

  async removeByIdr({ idr }: { idr: AggregateIdrType }): Promise<void> {
    const aggregate = await this.getOneByIdr({ idr });
    this.remove(aggregate.id);
  }

  reset(): void {
    this.aggregates.clear();
    this.relatedItems.clear();
    this.relatedLists.clear();
    this.idCounter = 1;

    // Clear all unique constraint maps
    for (const [constraintName, _] of this.aggregatesByUniqueConstraint) {
      this.aggregatesByUniqueConstraint.set(constraintName, new Map());
    }
  }
}
