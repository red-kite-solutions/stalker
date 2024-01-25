export type Subscription = CronSubscription | EventSubscription;

export interface EventSubscription extends EventSubscriptionData {
  _id: string;
}

export interface CronSubscription extends CronSubscriptionData {
  _id: string;
  builtIn: boolean;
}

export interface EventSubscriptionData extends SubscriptionData {
  type: 'event';
  cooldown: number;
  builtIn: boolean;
  finding: string;
  conditions?: Condition[] | undefined | null;
}

export interface CronSubscriptionData extends SubscriptionData {
  type: 'cron';
  cronExpression: string;
  input?: 'ALL_DOMAINS' | 'ALL_HOSTS' | 'ALL_TCP_PORTS';
}

export interface SubscriptionData {
  type: 'cron' | 'event';
  name: string;
  projectId: string;
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
