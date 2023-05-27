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
  private readonly allCompanies = 'all companies';

  public getSubscriptions(): Observable<FindingEventSubscription[]> {
    return <Observable<Array<FindingEventSubscription>>>this.http.get(`${environment.fmUrl}/subscriptions/`).pipe(
      map((data: any) => {
        const subs: FindingEventSubscription[] = [];
        for (const item of data) {
          const sub: FindingEventSubscription = {
            _id: item._id,
            name: item.name,
            finding: item.finding,
            companyId: item.companyId ? item.companyId : this.allCompanies,
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
    const newSub: any = await firstValueFrom(this.http.post(`${environment.fmUrl}/subscriptions/`, data));
    if (newSub.__v) delete newSub.__v;
    const parsedSub: FindingEventSubscription = {
      _id: newSub._id,
      name: newSub.name,
      finding: newSub.finding,
      companyId: newSub.companyId ? newSub.companyId : this.allCompanies,
      job: {
        name: newSub.jobName,
      },
    };
    if (newSub.jobParameters && Array.isArray(newSub.jobParameters)) parsedSub.job.parameters = newSub.jobParameters;
    if (newSub.conditions && Array.isArray(newSub.conditions)) parsedSub.conditions = newSub.conditions;
    return parsedSub;
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
      companyId: subscription.companyId === this.allCompanies ? undefined : subscription.companyId,
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
