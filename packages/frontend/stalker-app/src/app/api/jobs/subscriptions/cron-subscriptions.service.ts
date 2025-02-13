import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CronSubscription, CronSubscriptionData } from '../../../shared/types/subscriptions/subscription.type';
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
      isEnabled: subscription.isEnabled,
      builtIn: false,
      name: newSub.name,
      cronExpression: newSub.cronExpression,
      cooldown: newSub.cooldown ?? undefined,
      projectId: newSub.projectId ? newSub.projectId : allProjectsSubscriptions,
      input: newSub.input ?? undefined,
      batch: newSub.batch ?? undefined,
      job: {
        name: newSub.jobName,
      },
      conditions: newSub.conditions ?? undefined,
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

  public async duplicate(id: string) {
    return await firstValueFrom(this.http.post(`${environment.fmUrl}/cron-subscriptions`, { subscriptionId: id }));
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

    if (subscription.input) {
      data['batch'] = subscription.batch;
    }

    if (subscription.cooldown) {
      data['cooldown'] = subscription.cooldown;
    }

    if (subscription.conditions) {
      data['conditions'] = subscription.conditions;
    }

    return data;
  }

  public async updateIsEnabled(id: string, isEnabled: boolean) {
    await firstValueFrom(this.http.patch(`${environment.fmUrl}/cron-subscriptions/${id}`, { isEnabled }));
  }

  private toCronSubscriptionModel(data: any): CronSubscription {
    const sub: CronSubscription = {
      type: cronSubscriptionKey,
      _id: data._id,
      isEnabled: data.isEnabled,
      name: data.name,
      cronExpression: data.cronExpression,
      cooldown: data.cooldown ?? undefined,
      input: data.input ?? undefined,
      batch: data.batch ?? undefined,
      projectId: data.projectId ? data.projectId : allProjectsSubscriptions,
      job: { name: data.jobName },
      builtIn: data.builtIn,
      source: data.source,
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
