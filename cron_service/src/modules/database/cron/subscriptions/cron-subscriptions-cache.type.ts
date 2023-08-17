import { CronSubscriptionsDocument } from './cron-subscriptions.model';

export interface CronSubscriptionsDocumentCache
  extends CronSubscriptionsDocument {
  lastRunTry: number;
}
