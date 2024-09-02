export interface FieldFilter {
  key: string;
  data?: unknown;
}

export interface FindingsFilter {
  target?: string;
  findingDenyList?: string[];
  findingAllowList?: string[];
  fieldFilters?: FieldFilter[];
}
