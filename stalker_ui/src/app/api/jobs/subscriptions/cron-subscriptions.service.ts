import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { CronSubscription, CronSubscriptionData } from 'src/app/shared/types/subscriptions/subscription.type';
import { environment } from 'src/environments/environment';
import { allProjectsSubscriptions } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class CronSubscriptionsService {
  constructor(private http: HttpClient) {}

  public getSubscriptions(): Observable<CronSubscription[]> {
    return <Observable<Array<CronSubscription>>>this.http.get(`${environment.fmUrl}/cron-subscriptions/`).pipe(
      map((data: any) => {
        const subs: CronSubscriptionData[] = [];
        for (const item of data) {
          const sub: CronSubscription = {
            _id: item._id,
            name: item.name,
            cronExpression: item.cronExpression,
            input: item.input ?? undefined,
            projectId: item.projectId ? item.projectId : allProjectsSubscriptions,
            job: { name: item.jobName },
            builtIn: item.builtIn,
          };
          if (item.jobParameters) {
            sub.job.parameters = item.jobParameters;
          }
          subs.push(sub);
        }
        return subs;
      })
    );
  }

  public async create(subscription: CronSubscriptionData): Promise<CronSubscription> {
    const data: any = this.parseSubscription(subscription);
    const newSub: any = await firstValueFrom(this.http.post(`${environment.fmUrl}/cron-subscriptions/`, data));
    if (newSub.__v) delete newSub.__v;
    const parsedSub: CronSubscription = {
      _id: newSub._id,
      name: newSub.name,
      cronExpression: newSub.cronExpression,
      projectId: newSub.projectId ? newSub.projectId : allProjectsSubscriptions,
      input: newSub.input ?? undefined,
      job: {
        name: newSub.jobName,
      },
      builtIn: false,
    };
    if (newSub.jobParameters && Array.isArray(newSub.jobParameters)) parsedSub.job.parameters = newSub.jobParameters;
    return parsedSub;
  }

  public async edit(id: string, subscription: CronSubscriptionData) {
    const data: any = this.parseSubscription(subscription);
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/cron-subscriptions/${id}`, data));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/cron-subscriptions/${id}`));
  }

  private parseSubscription(subscription: CronSubscriptionData) {
    const data: any = {
      name: subscription.name,
      cronExpression: subscription.cronExpression,
      jobName: subscription.job.name,
      projectId: subscription.projectId === allProjectsSubscriptions ? undefined : subscription.projectId,
    };

    if (subscription.job.parameters) {
      data['jobParameters'] = subscription.job.parameters;
    }

    if (subscription.input) {
      data['input'] = subscription.input;
    }

    return data;
  }

  public async revert(id: string) {
    return await firstValueFrom(this.http.patch(`${environment.fmUrl}/cron-subscriptions/${id}?revert=true`, {}));
  }
}
