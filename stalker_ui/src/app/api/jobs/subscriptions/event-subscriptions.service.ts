import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { EventSubscription, EventSubscriptionData } from 'src/app/shared/types/subscriptions/subscription.type';
import { environment } from 'src/environments/environment';
import { allCompaniesSubscriptions } from '../../constants';
import { GenericSubscriptionService } from './base-subscription.service';

export const eventSubscriptionKey = 'event';

@Injectable({
  providedIn: 'root',
})
export class EventSubscriptionsService implements GenericSubscriptionService<EventSubscription> {
  constructor(private http: HttpClient) {}

  public getSubscriptions(): Observable<EventSubscription[]> {
    return <Observable<EventSubscription[]>>(
      this.http
        .get(`${environment.fmUrl}/event-subscriptions/`)
        .pipe(map((data: any) => data.map((x: any) => this.toEventSubscriptionModel(x))))
    );
  }

  public get(id: string): Observable<EventSubscription> {
    return <Observable<EventSubscription>>(
      this.http
        .get(`${environment.fmUrl}/event-subscriptions/${id}`)
        .pipe(map((data: any) => this.toEventSubscriptionModel(data)))
    );
  }

  public async create(subscription: EventSubscriptionData): Promise<EventSubscription> {
    const data: any = this.parseSubscription(subscription);
    const newSub: any = await firstValueFrom(this.http.post(`${environment.fmUrl}/event-subscriptions/`, data));
    if (newSub.__v) delete newSub.__v;
    const parsedSub: EventSubscription = {
      type: eventSubscriptionKey,
      _id: newSub._id,
      name: newSub.name,
      finding: newSub.finding,
      cooldown: newSub.cooldown,
      companyId: newSub.companyId ? newSub.companyId : allCompaniesSubscriptions,
      job: {
        name: newSub.jobName,
      },
      builtIn: false,
    };
    if (newSub.jobParameters && Array.isArray(newSub.jobParameters)) parsedSub.job.parameters = newSub.jobParameters;
    if (newSub.conditions && Array.isArray(newSub.conditions)) parsedSub.conditions = newSub.conditions;
    return parsedSub;
  }

  public async edit(id: string, subscription: EventSubscriptionData) {
    const data: any = this.parseSubscription(subscription);
    await firstValueFrom(this.http.put(`${environment.fmUrl}/event-subscriptions/${id}`, data));
  }

  public async delete(id: string) {
    await firstValueFrom(this.http.delete(`${environment.fmUrl}/event-subscriptions/${id}`));
  }

  private parseSubscription(subscription: EventSubscriptionData) {
    const data: any = {
      name: subscription.name,
      finding: subscription.finding,
      cooldown: subscription.cooldown,
      jobName: subscription.job.name,
      companyId: subscription.companyId === allCompaniesSubscriptions ? undefined : subscription.companyId,
    };

    if (subscription.job.parameters) {
      data['jobParameters'] = subscription.job.parameters;
    }

    if (subscription.conditions) {
      data['conditions'] = subscription.conditions;
    }
    return data;
  }

  public async revert(id: string) {
    await firstValueFrom(this.http.patch(`${environment.fmUrl}/event-subscriptions/${id}?revert=true`, {}));
  }

  private toEventSubscriptionModel(data: any): EventSubscription {
    const sub: EventSubscription = {
      type: eventSubscriptionKey,
      _id: data._id,
      name: data.name,
      finding: data.finding,
      companyId: data.companyId ? data.companyId : allCompaniesSubscriptions,
      cooldown: data.cooldown,
      builtIn: data.builtIn,
      job: { name: data.jobName },
    };
    if (data.jobParameters) {
      sub.job.parameters = data.jobParameters;
    }
    if (data.conditions) {
      sub.conditions = data.conditions;
    }

    return sub;
  }
}
