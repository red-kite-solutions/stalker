export class HostsPagingModel {
  page: string;
  pageSize: string;
  tags?: Array<string>;
  company?: string;
  domain?: string;
}

export class GetHostCountModel {
  domain?: string;
  tags?: Array<string>;
  company?: string;
}
