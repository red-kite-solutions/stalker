export class HostsPagingModel {
  page: string;
  pageSize: string;
}

export class HostFilterModel {
  domain?: Array<string>;
  tags?: Array<string>;
  company?: Array<string>;
  host?: Array<string>;
}
