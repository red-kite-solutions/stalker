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
  discriminator?: string;
  builtIn: boolean;
  finding: string;
}

export interface CronSubscriptionData extends SubscriptionData {
  type: 'cron';
  cronExpression: string;
  input?: 'ALL_DOMAINS' | 'ALL_HOSTS' | 'ALL_TCP_PORTS';
}

export interface SubscriptionData {
  type: 'cron' | 'event';
  name: string;
  isEnabled: boolean;
  projectId: string;
  job: {
    name: string;
    parameters?: JobParameter[] | undefined | null;
  };
  conditions?: Array<Condition | AndCondition | OrCondition> | undefined | null;
}

export interface AndCondition {
  and: Array<Condition | AndCondition | OrCondition>;
}

export interface OrCondition {
  or: Array<Condition | AndCondition | OrCondition>;
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
