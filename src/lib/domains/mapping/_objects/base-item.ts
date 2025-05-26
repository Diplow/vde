import {
  GenericAggregate,
  type GenericAggregateConstructorArgs,
} from "../../utils/generic-objects";

export interface Attrs {
  title: string;
  descr: string;
  link: string;
}

export interface RelatedItems {}
export interface RelatedLists {}

export interface BaseItemConstructorArgs
  extends GenericAggregateConstructorArgs<
    Partial<Attrs>,
    RelatedItems,
    RelatedLists
  > {}

export type BaseItemIdr = {
  id: number;
};

const DEFAULT_CENTER_TITLE = "The center of the map";
const DEFAULT_CENTER_DESCRIPTION =
  "This is the ultimate context for users consulting your map, please be descriptive.";

export class BaseItem extends GenericAggregate<
  Attrs,
  RelatedItems,
  RelatedLists
> {
  constructor(args: BaseItemConstructorArgs) {
    super({
      ...args,
      attrs: {
        ...args.attrs,
        title: args.attrs?.title ?? DEFAULT_CENTER_TITLE,
        descr: args.attrs?.descr ?? DEFAULT_CENTER_DESCRIPTION,
        link: args.attrs?.link ?? "",
      },
    });
  }
}

export type BaseItemWithId = BaseItem & { id: number };
