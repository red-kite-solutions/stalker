export class WebsitePagingModel {
  page: string;
  pageSize: string;
}

export class WebsiteFilterModel {
  domains?: Array<string>;
  tags?: Array<string>;
  project?: Array<string>;
  hosts?: Array<string>;
  ports?: Array<number>;
  firstSeenStartDate?: number;
  firstSeenEndDate?: number;
  blocked?: boolean;
  merged?: boolean;
}
