import { CronSubscription } from './cron-subscriptions/cron-subscriptions.model';
import { EventSubscription } from './event-subscriptions/event-subscriptions.model';

export type Subscription = CronSubscription | EventSubscription;

export type SubscriptionWithType = (CronSubscription | EventSubscription) & {
  triggerType: 'cron' | 'event';
};
