import {
  type GenericAggregate,
  type GenericAttributes,
  type GenericRelatedLists,
  type GenericRelatedItems,
} from "./generic-objects";

/**
 * Transaction context that can be passed to repository methods
 */
export interface TransactionContext {
  tx?: any; // Generic transaction type, specific implementations will define their own
}

export interface GenericRepository<
  A extends GenericAttributes,
  I extends GenericRelatedItems,
  L extends GenericRelatedLists,
  T extends GenericAggregate<A, I, L> & { id: number },
  Idr extends Partial<{
    id?: number;
    attrs?: Partial<A>;
    relatedItems?: Partial<I>;
    relatedLists?: Partial<L>;
  }>,
> {
  handleCascading(): boolean;
  getOne(id: number, ctx?: TransactionContext): Promise<T>;
  getOneByIdr({
    idr,
    limit,
    offset,
    ctx,
  }: {
    idr: Idr;
    limit?: number;
    offset?: number;
    ctx?: TransactionContext;
  }): Promise<T>;
  getMany({ limit, offset }: { limit?: number; offset?: number }): Promise<T[]>;
  getManyByIdr({
    idrs,
    limit,
    offset,
  }: {
    idrs: Idr[];
    limit?: number;
    offset?: number;
  }): Promise<T[]>;
  create({
    attrs,
    relatedItems,
    relatedLists,
  }: {
    attrs: A;
    relatedItems: I;
    relatedLists: L;
  }): Promise<T>;
  update({ aggregate, attrs, ctx }: { aggregate: T; attrs: Partial<A>; ctx?: TransactionContext }): Promise<T>;
  updateByIdr({ idr, attrs, ctx }: { idr: Idr; attrs: Partial<A>; ctx?: TransactionContext }): Promise<T>;
  updateRelatedItem<K extends keyof I>({
    aggregate,
    key,
    item,
  }: {
    aggregate: T;
    key: K;
    item: I[K];
  }): Promise<T>;
  updateRelatedItemByIdr<K extends keyof I>({
    idr,
    key,
    item,
  }: {
    idr: Idr;
    key: K;
    item: I[K];
  }): Promise<T>;
  addToRelatedList<K extends keyof L>({
    aggregate,
    key,
    item,
  }: {
    aggregate: T;
    key: K;
    item: L[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<T>;
  addToRelatedListByIdr<K extends keyof L>({
    idr,
    key,
    item,
  }: {
    idr: Idr;
    key: K;
    item: L[K] extends Array<infer ItemType> ? ItemType : never;
  }): Promise<T>;
  removeFromRelatedList<K extends keyof L>({
    aggregate,
    key,
    itemId,
  }: {
    aggregate: T;
    key: K;
    itemId: number;
  }): Promise<T>;
  removeFromRelatedListByIdr<K extends keyof L>({
    idr,
    key,
    itemId,
  }: {
    idr: Idr;
    key: K;
    itemId: number;
  }): Promise<T>;
  remove(id: number): Promise<void>;
  removeByIdr({ idr }: { idr: Idr }): Promise<void>;
}
