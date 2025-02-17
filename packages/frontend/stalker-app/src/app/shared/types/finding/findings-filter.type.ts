export interface FieldFilter {
  key: string;
  data?: unknown;
}

export interface FindingsFilter {
  targets?: string[];
  findingDenyList?: string[];
  findingAllowList?: string[];
  fieldFilters?: FieldFilter[];
}
