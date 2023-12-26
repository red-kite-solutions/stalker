export type Subscription = CronSubscription | EventSubscription;

export interface EventSubscription extends EventSubscriptionData {
  _id: string;
}

export interface CronSubscription extends CronSubscriptionData {
  _id: string;
}

export interface EventSubscriptionData extends SubscriptionData {
  finding: string;
  conditions?: Condition[] | undefined | null;
}

export interface CronSubscriptionData extends SubscriptionData {
  cronExpression: string;
}

export interface SubscriptionData {
  name: string;
  companyId: string;
  job: {
    name: string;
    parameters?: JobParameter[] | undefined | null;
  };
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
