import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FindingEventSubscription, SubscriptionData } from 'src/app/shared/types/FindingEventSubscription';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsService {
  constructor(private http: HttpClient) {}

  // public getSubscriptions(): Observable<any[]> {
  //   return <Observable<Array<any>>>this.http.get(`${environment.fmUrl}/subscriptions/`);
  // }

  public async create(subscription: SubscriptionData): Promise<FindingEventSubscription> {
    const data: any = {
      name: subscription.name,
      finding: subscription.finding,
      jobName: subscription.job.name,
    };

    if (subscription.job.parameters) {
      data['jobParameters'] = subscription.job.parameters;
    }

    if (subscription.conditions) {
      data['conditions'] = subscription.conditions;
    }

    return <FindingEventSubscription>await firstValueFrom(this.http.post(`${environment.fmUrl}/subscriptions/`, data));
  }

  // public async delete(id: string) {
  //   return await firstValueFrom(this.http.delete(`${environment.fmUrl}/tags/${id}`));
  // }
}
