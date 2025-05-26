export type GenericHistory = {
  createdAt: Date;
  updatedAt: Date;
};

export type GenericAttributes = Record<string, any>;

export type GenericRelatedItems =
  | {
      [key: string]:
        | (GenericAggregate<
            GenericAttributes,
            GenericRelatedItems,
            GenericRelatedLists
          > & { id: number })
        | null;
    }
  | {};

export type GenericRelatedLists =
  | {
      [key: string]: Array<
        GenericAggregate<
          GenericAttributes,
          GenericRelatedItems,
          GenericRelatedLists
        > & { id: number }
      >;
    }
  | {};

export type GenericAggregateConstructorArgs<
  A extends GenericAttributes,
  I extends GenericRelatedItems,
  L extends GenericRelatedLists,
> = {
  id?: number;
  history?: GenericHistory;
  relatedItems?: I;
  relatedLists?: L;
  attrs?: A;
};

export class GenericAggregate<
  A extends GenericAttributes,
  I extends GenericRelatedItems,
  L extends GenericRelatedLists,
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
