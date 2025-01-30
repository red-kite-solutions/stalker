import { CronSubscription } from './cron-subscriptions/cron-subscriptions.model';
import { EventSubscription } from './event-subscriptions/event-subscriptions.model';

export type Subscription = CronSubscription | EventSubscription;

export type SubscriptionWithType = (CronSubscription | EventSubscription) & {
  triggerType: 'cron' | 'event';
};

export class JobParameter {
  public name!: string;
  public value!: unknown;
}

export class JobCondition {
  public lhs!: string | number | boolean | Array<boolean | string | number>;
  public operator: string;
  public rhs!: string | number | boolean | Array<boolean | string | number>;
}

export class AndJobCondition {
  public and!: Array<AndJobCondition | OrJobCondition | JobCondition>;
}

export class OrJobCondition {
  public or!: Array<AndJobCondition | OrJobCondition | JobCondition>;
}
