import { Observable } from 'rxjs';
import { SubscriptionData } from '../../../shared/types/subscriptions/subscription.type';

export const cronSubscriptionKey = 'cron';

export interface GenericSubscriptionService<T extends SubscriptionData> {
  getSubscriptions(): Observable<T[]>;

  get(id: string): Observable<T>;

  create(subscription: T): Promise<T>;

  edit(id: string, subscription: T): Promise<void>;

  delete(id: string): Promise<void>;
}
