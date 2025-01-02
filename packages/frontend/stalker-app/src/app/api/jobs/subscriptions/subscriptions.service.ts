import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import {
  CronSubscription,
  CronSubscriptionData,
  EventSubscription,
  EventSubscriptionData,
} from '../../../shared/types/subscriptions/subscription.type';
import { stringify } from 'yaml';
import { Page } from '../../../shared/types/page.type';
import { normalizeSearchString } from '../../../utils/normalize-search-string';
import { CronSubscriptionsService } from './cron-subscriptions.service';
import { EventSubscriptionsService } from './event-subscriptions.service';

export type SubscriptionType = 'event' | 'cron';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  constructor(
    private eventsSubscriptionsService: EventSubscriptionsService,
    private cronSubscriptionsService: CronSubscriptionsService
  ) {}

  getSubscriptions(
    filters: string[],
    page: number,
    pageSize: number
  ): Observable<Page<CronSubscription | EventSubscription>> {
    return combineLatest([
      this.eventsSubscriptionsService.getSubscriptions(),
      this.cronSubscriptionsService.getSubscriptions(),
    ]).pipe(
      map(([eventSubscriptions, cronSubscriptions]: [EventSubscription[], CronSubscription[]]) => [
        ...eventSubscriptions,
        ...cronSubscriptions,
      ]),
      map((subs) => subs.sort((a, b) => a._id.localeCompare(b._id))),
      map((subs) => subs.filter((sub) => !filters?.length || this.filterSubscription(sub, filters))),
      map((subs) => ({ items: subs.slice(page * pageSize, page * pageSize + pageSize), totalRecords: subs.length }))
    );
  }

  get(
    type: SubscriptionType,
    id: string
  ): Observable<(CronSubscriptionData | EventSubscriptionData) & { yaml: string }> {
    const obs: Observable<CronSubscriptionData | EventSubscriptionData> = this.getService(type).get(id);

    return obs.pipe(
      map((sub) => {
        const yaml = this.getYaml(sub);
        return { ...sub, yaml };
      })
    );
  }

  create(
    type: SubscriptionType,
    subscription: CronSubscriptionData | EventSubscriptionData
  ): Promise<CronSubscription | EventSubscription> {
    return this.getService(type).create(subscription as any);
  }

  edit(type: SubscriptionType, id: string, subscription: CronSubscriptionData | EventSubscriptionData): Promise<void> {
    return this.getService(type).edit(id, subscription as any);
  }

  delete(type: SubscriptionType, id: string): Promise<void> {
    return this.getService(type).delete(id);
  }

  duplicate(type: SubscriptionType, id: string) {
    return this.getService(type).duplicate(id);
  }

  updateIsEnabled(type: SubscriptionType, id: string, isEnabled: boolean): Promise<void> {
    return this.getService(type).updateIsEnabled(id, isEnabled);
  }

  private getService(type: 'cron'): CronSubscriptionsService;
  private getService(type: 'event'): EventSubscriptionsService;
  private getService(type: SubscriptionType): CronSubscriptionsService | EventSubscriptionsService;
  private getService(type: SubscriptionType) {
    if (type === 'cron') return this.cronSubscriptionsService;
    if (type === 'event') return this.eventsSubscriptionsService;

    throw new Error(`Unknown subscription type ${type}.`);
  }

  private getYaml(subscription: CronSubscriptionData | EventSubscriptionData) {
    const copy = JSON.parse(JSON.stringify(subscription));
    delete copy._id;
    delete copy.type;
    delete copy.projectId;
    delete copy.isEnabled;
    if (copy.job?.parameters?.length === 0) {
      delete copy.job.parameters;
    }
    if (copy.conditions?.length === 0) {
      delete copy.conditions;
    }

    return stringify(copy);
  }

  private filterSubscription(subscription: EventSubscription | CronSubscription, filters: string[]) {
    const event = subscription as EventSubscription;
    const cron = subscription as CronSubscription;
    const parts = [
      subscription.job?.name,
      subscription.name,
      cron.cronExpression,
      event.findings,
      cron.cronExpression ? 'cron' : 'event',
      subscription.isEnabled === false ? 'disabled' : 'enabled',
    ];
    return filters.some((filter) => normalizeSearchString(parts.join(' ')).includes(filter));
  }
}
