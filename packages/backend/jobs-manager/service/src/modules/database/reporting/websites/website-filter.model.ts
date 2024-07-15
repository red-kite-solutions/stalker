export class WebsitePagingModel {
  page: string;
  pageSize: string;
}

export class WebsiteFilterModel {
  domain?: Array<string>;
  tags?: Array<string>;
  project?: Array<string>;
  host?: Array<string>;
  port?: Array<number>;
  firstSeenStartDate?: number;
  firstSeenEndDate?: number;
  blocked?: boolean;
  merged?: boolean;
}
