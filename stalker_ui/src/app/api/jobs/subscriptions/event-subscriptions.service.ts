import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { EventSubscription, EventSubscriptionData } from 'src/app/shared/types/subscriptions/subscription.type';
import { environment } from 'src/environments/environment';
import { allCompaniesSubscriptions } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class EventSubscriptionsService {
  constructor(private http: HttpClient) {}

  public getSubscriptions(): Observable<EventSubscription[]> {
    return <Observable<Array<EventSubscription>>>this.http.get(`${environment.fmUrl}/event-subscriptions/`).pipe(
      map((data: any) => {
        const subs: EventSubscription[] = [];
        for (const item of data) {
          const sub: EventSubscription = {
            _id: item._id,
            name: item.name,
            finding: item.finding,
            companyId: item.companyId ? item.companyId : allCompaniesSubscriptions,
            cooldown: item.cooldown,
            builtIn: item.builtIn,
            job: { name: item.jobName },
          };
          if (item.jobParameters) {
            sub.job.parameters = item.jobParameters;
          }
          if (item.conditions) {
            sub.conditions = item.conditions;
          }
          subs.push(sub);
        }
        return subs;
      })
    );
  }

  public async create(subscription: EventSubscriptionData): Promise<EventSubscription> {
    const data: any = this.parseSubscription(subscription);
    const newSub: any = await firstValueFrom(this.http.post(`${environment.fmUrl}/event-subscriptions/`, data));
    if (newSub.__v) delete newSub.__v;
    const parsedSub: EventSubscription = {
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
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/event-subscriptions/${id}`, data));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/event-subscriptions/${id}`));
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
    return await firstValueFrom(this.http.patch(`${environment.fmUrl}/event-subscriptions/${id}?revert=true`, {}));
  }
}
