export interface FindingEventSubscription extends SubscriptionData {
  _id: string;
}

export interface SubscriptionData {
  name: string;
  finding: string;
  companyId: string | null;
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
