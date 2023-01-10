import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { FindingEventSubscription, SubscriptionData } from 'src/app/shared/types/finding-event-subscription';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsService {
  constructor(private http: HttpClient) {}

  public getSubscriptions(): Observable<FindingEventSubscription[]> {
    return <Observable<Array<FindingEventSubscription>>>this.http.get(`${environment.fmUrl}/subscriptions/`).pipe(
      map((data: any) => {
        const subs: FindingEventSubscription[] = [];
        for (const item of data) {
          const sub: FindingEventSubscription = {
            _id: item._id,
            name: item.name,
            finding: item.finding,
            companyId: item.companyId,
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

  public async create(subscription: SubscriptionData): Promise<FindingEventSubscription> {
    const data: any = this.parseSubscription(subscription);
    return <FindingEventSubscription>await firstValueFrom(this.http.post(`${environment.fmUrl}/subscriptions/`, data));
  }

  public async edit(id: string, subscription: SubscriptionData) {
    const data: any = this.parseSubscription(subscription);
    return await firstValueFrom(this.http.post(`${environment.fmUrl}/subscriptions/${id}`, data));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/subscriptions/${id}`));
  }

  private parseSubscription(subscription: SubscriptionData) {
    const data: any = {
      name: subscription.name,
      finding: subscription.finding,
      jobName: subscription.job.name,
      companyId: subscription.companyId,
    };

    if (subscription.job.parameters) {
      data['jobParameters'] = subscription.job.parameters;
    }

    if (subscription.conditions) {
      data['conditions'] = subscription.conditions;
    }
    return data;
  }
}
