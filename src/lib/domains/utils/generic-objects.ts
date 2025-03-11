export type GenericEntityData = {
  id: number | string;
  [key: string]: any;
};

export class GenericAggregate {
  readonly data: GenericEntityData;
  readonly relatedItems: {
    [key: string]: GenericAggregate;
  };
  readonly relatedLists: {
    [key: string]: Array<GenericAggregate>;
  };

  constructor(
    data: GenericEntityData,
    relatedItems: {
      [key: string]: GenericAggregate;
    },
    relatedLists: {
      [key: string]: Array<GenericAggregate>;
    },
  ) {
    this.data = data;
    this.relatedItems = relatedItems;
    this.relatedLists = relatedLists;
  }
}

export class GenericEntity extends GenericAggregate {
  readonly data: GenericEntityData;
  readonly relatedItems = {};
  readonly relatedLists = {};

  constructor(data: GenericEntityData) {
    super(data, {}, {});
    this.data = data;
  }
}
