export class WebsiteFilterModel {
  domain?: Array<string>;
  tag?: Array<string>;
  project?: Array<string>;
  host?: Array<string>;
  port?: Array<number>;
  firstSeenStartDate?: number;
  firstSeenEndDate?: number;
  blocked?: boolean;
  merged?: boolean;
  mergedInId?: string;
}
