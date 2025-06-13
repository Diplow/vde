export type GenericHistory = {
  createdAt: Date;
  updatedAt: Date;
};

export type GenericAttributes = Record<string, unknown>;

// Looser constraints for type checking
// The constraint just needs to be an object, the actual type safety comes from the specific types
export type RelatedItemsConstraint = object;

export type RelatedListsConstraint = object;

// Keep the original types for backward compatibility
export type GenericRelatedItems = RelatedItemsConstraint;
export type GenericRelatedLists = RelatedListsConstraint;

export type GenericAggregateConstructorArgs<
  A extends GenericAttributes,
  I extends RelatedItemsConstraint,
  L extends RelatedListsConstraint,
> = {
  id?: number;
  history?: GenericHistory;
  relatedItems?: I;
  relatedLists?: L;
  attrs?: A;
};

export class GenericAggregate<
  A extends GenericAttributes,
  I extends RelatedItemsConstraint,
  L extends RelatedListsConstraint,
> {
  readonly id: number | undefined;
  readonly history: GenericHistory;
  readonly relatedItems: I;
  readonly relatedLists: L;
  readonly attrs: A;

  constructor({
    id = undefined,
    history = undefined,
    relatedItems = {} as I,
    relatedLists = {} as L,
    attrs = {} as A,
  }: GenericAggregateConstructorArgs<A, I, L>) {
    this.id = id;
    const now = new Date();
    this.history = history ?? {
      createdAt: now,
      updatedAt: now,
    };
    this.attrs = attrs;
    this.relatedItems = relatedItems;
    this.relatedLists = relatedLists;
  }
}

export type GenericAggregateType = typeof GenericAggregate;
