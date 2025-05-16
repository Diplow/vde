import {
  GenericAggregate,
  GenericAttributes,
  GenericHistory,
  GenericRelatedItems,
  GenericRelatedLists,
} from "~/lib/domains/utils/generic-objects";
import { GenericRepository } from "~/lib/domains/utils/generic-repository";
import { AnyPgTable, PgDatabase } from "drizzle-orm/pg-core";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "~/lib/infrastructure/drizzle/schema"; // Assuming schema import

// Type for aggregate constructor - similar to the memory one
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
 * Generic Drizzle/Postgres repository for aggregates
 */
export class GenericAggregateDrizzlePostgresRepository<
  A extends GenericAttributes,
  I extends GenericRelatedItems,
  L extends GenericRelatedLists,
  T extends GenericAggregate<A, I, L> & { id: number },
  IdrType extends Partial<{
    id: number;
    attrs: Partial<A>;
    relatedItems: Partial<I>;
    relatedLists: Partial<L>;
  }>,
  // Add generic types for Drizzle schema and table
  DbSchema extends typeof schema,
  MainTable extends AnyPgTable, // Adjust based on your actual table type needs
> implements GenericRepository<A, I, L, T, IdrType>
{
  protected db: NodePgDatabase<DbSchema>;
  protected table: MainTable;
  protected aggregateConstructor: AggregateConstructor<A, I, L, T>;

  constructor({
    db,
    table,
    aggregateConstructor,
  }: {
    db: NodePgDatabase<DbSchema>;
    table: MainTable;
    aggregateConstructor: AggregateConstructor<A, I, L, T>;
  }) {
    this.db = db;
    this.table = table;
    this.aggregateConstructor = aggregateConstructor;
  }

  // --- Implementation of GenericRepository methods ---

  async getOne(id: number): Promise<T> {
    // TODO: Implement Drizzle query to fetch by ID
    // Needs to handle fetching main attributes, related items, and lists
    // Potentially using joins or separate queries based on schema structure
    console.log(`Fetching aggregate with ID: ${id}`);
    throw new Error("Method not implemented.");
    // Example structure (needs adaptation):
    // const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);
    // if (!result.length) throw new Error(`Aggregate with ID ${id} not found`);
    // const dbData = result[0];
    // const { attrs, relatedItems, relatedLists, history } = this.mapDbDataToAggregateComponents(dbData);
    // return new this.aggregateConstructor({ id, history, attrs, relatedItems, relatedLists });
  }

  async getOneByIdr({ idr }: { idr: IdrType }): Promise<T> {
    // TODO: Implement Drizzle query based on the identifier fields
    // This will require dynamic query building based on the IdrType structure
    console.log(`Fetching aggregate with Idr: ${JSON.stringify(idr)}`);
    throw new Error("Method not implemented.");
    // Example: Build `where` clause dynamically based on idr properties
  }

  async getMany({
    limit = 50,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    // TODO: Implement Drizzle query with limit and offset
    console.log(`Fetching aggregates with limit: ${limit}, offset: ${offset}`);
    throw new Error("Method not implemented.");
    // Example:
    // const results = await this.db.select().from(this.table).limit(limit).offset(offset).orderBy(asc(this.table.createdAt)); // Assuming createdAt field
    // return Promise.all(results.map(dbData => { /* map to aggregate */ }));
  }

  async getManyByIdr({
    idrs,
    limit = 50,
    offset = 0,
  }: {
    idrs: IdrType[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    // TODO: Implement Drizzle query for multiple identifiers
    // Might involve complex OR conditions or multiple queries
    console.log(
      `Fetching aggregates for Idrs: ${JSON.stringify(idrs.slice(offset, offset + limit))}`,
    );
    throw new Error("Method not implemented.");
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
    // TODO: Implement Drizzle insert operation
    // Needs to map aggregate components to table columns
    // Handle related items/lists (might involve separate inserts or relation tables)
    // Return the created aggregate, potentially fetching it back after insert
    console.log(`Creating aggregate with attrs: ${JSON.stringify(attrs)}`);
    throw new Error("Method not implemented.");
    // Example:
    // const dbInput = this.mapAggregateComponentsToDbInput({ attrs, relatedItems, relatedLists });
    // const result = await this.db.insert(this.table).values(dbInput).returning();
    // const newId = result[0]?.id;
    // return this.getOne(newId); // Fetch the complete aggregate
  }

  async update({
    aggregate,
    attrs,
  }: {
    aggregate: T;
    attrs: Partial<A>;
  }): Promise<T> {
    // TODO: Implement Drizzle update operation
    // Map partial attrs to table columns
    // Update timestamp
    // Return the updated aggregate
    console.log(
      `Updating aggregate ID ${aggregate.id} with attrs: ${JSON.stringify(attrs)}`,
    );
    throw new Error("Method not implemented.");
    // Example:
    // const dbUpdateData = this.mapPartialAttrsToDbUpdate(attrs);
    // await this.db.update(this.table).set({ ...dbUpdateData, updatedAt: new Date() }).where(eq(this.table.id, aggregate.id));
    // return this.getOne(aggregate.id);
  }

  async updateByIdr({
    idr,
    attrs,
  }: {
    idr: IdrType;
    attrs: Partial<A>;
  }): Promise<T> {
    // TODO: Get the aggregate ID using getOneByIdr first, then call update
    console.log(
      `Updating aggregate by Idr ${JSON.stringify(idr)} with attrs: ${JSON.stringify(attrs)}`,
    );
    const aggregate = await this.getOneByIdr({ idr });
    return this.update({ aggregate, attrs });
    // throw new Error("Method not implemented."); // Or implement directly if efficient
  }

  async updateRelatedItem<K extends keyof I>({
    aggregate,
    key,
    item,
  }: {
    aggregate: T;
    key: K;
    item: I[K];
  }): Promise<T> {
    // TODO: Implement logic to update related item
    // Might involve updating a foreign key column or a relation table
    console.log(
      `Updating related item '${String(key)}' for aggregate ID ${aggregate.id}`,
    );
    throw new Error("Method not implemented.");
  }

  async updateRelatedItemByIdr<K extends keyof I>({
    idr,
    key,
    item,
  }: {
    idr: IdrType;
    key: K;
    item: I[K];
  }): Promise<T> {
    // TODO: Get aggregate first, then call updateRelatedItem
    console.log(
      `Updating related item '${String(key)}' for aggregate by Idr ${JSON.stringify(idr)}`,
    );
    const aggregate = await this.getOneByIdr({ idr });
    return this.updateRelatedItem({ aggregate, key, item });
    // throw new Error("Method not implemented.");
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
    // TODO: Implement logic to add item to a related list
    // Might involve inserting into a junction/relation table
    console.log(
      `Adding item to related list '${String(key)}' for aggregate ID ${aggregate.id}`,
    );
    throw new Error("Method not implemented.");
  }

  async addToRelatedListByIdr<K extends keyof L>({
    idr,
    key,
    item,
  }: {
    idr: IdrType;
    key: K;
    item: L[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<T> {
    // TODO: Get aggregate first, then call addToRelatedList
    console.log(
      `Adding item to related list '${String(key)}' for aggregate by Idr ${JSON.stringify(idr)}`,
    );
    const aggregate = await this.getOneByIdr({ idr });
    return this.addToRelatedList({ aggregate, key, item });
    // throw new Error("Method not implemented.");
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
    // TODO: Implement logic to remove item from a related list
    // Might involve deleting from a junction/relation table
    console.log(
      `Removing item ID ${itemId} from related list '${String(key)}' for aggregate ID ${aggregate.id}`,
    );
    throw new Error("Method not implemented.");
  }

  async removeFromRelatedListByIdr<K extends keyof L>({
    idr,
    key,
    itemId,
  }: {
    idr: IdrType;
    key: K;
    itemId: number;
  }): Promise<T> {
    // TODO: Get aggregate first, then call removeFromRelatedList
    console.log(
      `Removing item ID ${itemId} from related list '${String(key)}' for aggregate by Idr ${JSON.stringify(idr)}`,
    );
    const aggregate = await this.getOneByIdr({ idr });
    return this.removeFromRelatedList({ aggregate, key, itemId });
    // throw new Error("Method not implemented.");
  }

  async remove(id: number): Promise<void> {
    // TODO: Implement Drizzle delete operation
    // Consider cascading deletes or handling related data removal
    console.log(`Removing aggregate with ID: ${id}`);
    throw new Error("Method not implemented.");
    // Example:
    // await this.db.delete(this.table).where(eq(this.table.id, id));
  }

  async removeByIdr({ idr }: { idr: IdrType }): Promise<void> {
    // TODO: Get aggregate ID first, then call remove
    console.log(`Removing aggregate by Idr: ${JSON.stringify(idr)}`);
    const aggregate = await this.getOneByIdr({ idr });
    await this.remove(aggregate.id);
    // throw new Error("Method not implemented."); // Or implement directly if efficient
  }

  // --- Helper methods (Protected) ---

  // protected mapDbDataToAggregateComponents(dbData: any): { attrs: A, relatedItems: I, relatedLists: L, history: GenericHistory } {
  //   // TODO: Implement mapping from Drizzle result object(s) to aggregate parts
  //   throw new Error("Helper 'mapDbDataToAggregateComponents' not implemented.");
  // }

  // protected mapAggregateComponentsToDbInput(components: { attrs: A, relatedItems: I, relatedLists: L }): any {
  //   // TODO: Implement mapping from aggregate parts to Drizzle insert input
  //   throw new Error("Helper 'mapAggregateComponentsToDbInput' not implemented.");
  // }

  // protected mapPartialAttrsToDbUpdate(attrs: Partial<A>): any {
  //   // TODO: Implement mapping from partial attributes to Drizzle update set object
  //   throw new Error("Helper 'mapPartialAttrsToDbUpdate' not implemented.");
  // }

  // protected buildIdrWhereClause(idr: IdrType): SQL | undefined {
  // TODO: Implement logic to build a Drizzle `where` clause from the Idr object
  // Needs to handle different fields in attrs, relatedItems, relatedLists
  //    throw new Error("Helper 'buildIdrWhereClause' not implemented.");
  // }

  // Consider adding methods for handling unique constraints if needed,
  // although primary/unique constraints should ideally be defined in the DB schema.
}
