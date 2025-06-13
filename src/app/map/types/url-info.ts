export interface URLInfo {
  pathname: string;
  searchParamsString: string;
  rootItemId: string;
  scale?: string;
  expandedItems?: string;
  isDynamic?: string;
  focus?: string;
}

export interface URLSearchParams {
  scale?: string;
  expandedItems?: string;
  isDynamic?: string;
  focus?: string;
}
