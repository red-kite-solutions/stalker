import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { CronSubscription, CronSubscriptionData } from 'src/app/shared/types/subscriptions/subscription.type';
import { environment } from 'src/environments/environment';
import { allProjectsSubscriptions } from '../../constants';
import { GenericSubscriptionService } from './base-subscription.service';

export const cronSubscriptionKey = 'cron';

@Injectable({
  providedIn: 'root',
})
export class CronSubscriptionsService implements GenericSubscriptionService<CronSubscription> {
  constructor(private http: HttpClient) {}

  public getSubscriptions(): Observable<CronSubscription[]> {
    return <Observable<Array<CronSubscription>>>(
      this.http
        .get(`${environment.fmUrl}/cron-subscriptions/`)
        .pipe(map((data: any) => data.map((x: any) => this.toCronSubscriptionModel(x))))
    );
  }

  public get(id: string): Observable<CronSubscription> {
    return <Observable<CronSubscription>>(
      this.http
        .get(`${environment.fmUrl}/cron-subscriptions/${id}`)
        .pipe(map((data: any) => this.toCronSubscriptionModel(data)))
    );
  }

  public async create(subscription: CronSubscriptionData): Promise<CronSubscription> {
    const data: any = this.parseSubscription(subscription);
    const newSub: any = await firstValueFrom(this.http.post(`${environment.fmUrl}/cron-subscriptions/`, data));
    if (newSub.__v) delete newSub.__v;
    const parsedSub: CronSubscription = {
      type: cronSubscriptionKey,
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
    await firstValueFrom(this.http.put(`${environment.fmUrl}/cron-subscriptions/${id}`, data));
  }

  public async delete(id: string) {
    await firstValueFrom(this.http.delete(`${environment.fmUrl}/cron-subscriptions/${id}`));
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
    await firstValueFrom(this.http.patch(`${environment.fmUrl}/cron-subscriptions/${id}?revert=true`, {}));
  }

  private toCronSubscriptionModel(data: any): CronSubscription {
    const sub: CronSubscription = {
      type: cronSubscriptionKey,
      _id: data._id,
      name: data.name,
      cronExpression: data.cronExpression,
      input: data.input ?? undefined,
      projectId: data.projectId ? data.projectId : allProjectsSubscriptions,
      job: { name: data.jobName },
      builtIn: data.builtIn,
    };
    if (data.jobParameters) {
      sub.job.parameters = data.jobParameters;
    }

    return sub;
  }
}
