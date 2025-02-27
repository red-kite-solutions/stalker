export class HostFilterModel {
  domains?: Array<string>;
  tags?: Array<string>;
  projects?: Array<string>;
  hosts?: Array<string>;
  firstSeenStartDate?: number;
  firstSeenEndDate?: number;
  blocked?: boolean;
  ranges?: string[];
}
