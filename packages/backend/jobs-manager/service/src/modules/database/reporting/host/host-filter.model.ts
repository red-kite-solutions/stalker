export class HostsPagingModel {
  page: string;
  pageSize: string;
}

export class HostFilterModel {
  domain?: Array<string>;
  tags?: Array<string>;
  project?: Array<string>;
  host?: Array<string>;
  firstSeenStartDate?: number;
  firstSeenEndDate?: number;
}
