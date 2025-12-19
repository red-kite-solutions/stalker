export class WebsiteFilterModel {
  query: string;
  domains?: Array<string>;
  tags?: Array<string>;
  projects?: Array<string>;
  hosts?: Array<string>;
  ports?: Array<number>;
  firstSeenStartDate?: number;
  firstSeenEndDate?: number;
  blocked?: boolean;
  merged?: boolean;
  mergedInId?: string;
}
