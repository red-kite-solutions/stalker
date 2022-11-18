export class HostsPagingModel {
  page: string;
  pageSize: string;
}

export class GetHostCountModel {
  domain?: Array<string>;
  tags?: Array<string>;
  company?: Array<string>;
}
