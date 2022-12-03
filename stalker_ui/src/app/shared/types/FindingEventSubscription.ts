export interface FindingEventSubscription {
  name: string;
  finding: string;
  job: {
    name: string;
    parameters?: JobParameter[] | undefined | null;
  };
  conditions?: Condition[] | undefined | null;
}

export interface Condition {
  lhs: string | number | boolean;
  operator: string;
  rhs: string | number | boolean;
}

export interface JobParameter {
  name: string;
  value: any;
}
