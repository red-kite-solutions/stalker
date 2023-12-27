import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, UpdateResult } from 'mongodb';
import { Model, Types } from 'mongoose';
import {
  HttpBadRequestException,
  HttpNotFoundException,
} from '../../../../exceptions/http.exceptions';
import { ConfigService } from '../../admin/config/config.service';
import { CustomJobsService } from '../../custom-jobs/custom-jobs.service';
import { JobFactory } from '../../jobs/jobs.factory';
import { CustomJob } from '../../jobs/models/custom-job.model';
import { Job } from '../../jobs/models/jobs.model';
import { CompanyService } from '../../reporting/company.service';
import { CRON_SUBSCRIPTIONS_FILES_PATH } from '../subscriptions.constants';
import { SubscriptionsUtils } from '../subscriptions.utils';
import { CronSubscriptionDto } from './cron-subscriptions.dto';
import {
  CronSubscription,
  CronSubscriptionsDocument,
  JobParameter,
} from './cron-subscriptions.model';
import { JobsService } from '../../jobs/jobs.service';

@Injectable()
export class CronSubscriptionsService {
  private logger = new Logger(CronSubscriptionsService.name);

  constructor(
    @InjectModel('cronSubscriptions')
    private readonly subscriptionModel: Model<CronSubscription>,
    private readonly companyService: CompanyService,
    private readonly configService: ConfigService,
    private readonly customJobsService: CustomJobsService,
    private readonly jobsService: JobsService,
  ) {}

  public async create(dto: CronSubscriptionDto) {
    const sub: CronSubscription = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
    };
    return await this.subscriptionModel.create(sub);
  }

  public async getAll() {
    return await this.subscriptionModel.find({}, '-file');
  }

  public async edit(
    id: string,
    dto: CronSubscriptionDto,
  ): Promise<UpdateResult> {
    const sub: Partial<CronSubscription> = {
      companyId: dto.companyId ? new Types.ObjectId(dto.companyId) : null,
      name: dto.name,
      cronExpression: dto.cronExpression,
      jobName: dto.jobName,
      jobParameters: dto.jobParameters,
    };
    return await this.subscriptionModel.updateOne(
      { _id: { $eq: new Types.ObjectId(id) } },
      sub,
    );
  }

  public async delete(id: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteOne({
      _id: { $eq: new Types.ObjectId(id) },
    });
  }

  public async deleteAllForCompany(companyId: string): Promise<DeleteResult> {
    return await this.subscriptionModel.deleteMany({
      companyId: { $eq: new Types.ObjectId(companyId) },
    });
  }

  /**
   * Launches the job specified in a cron subscription.
   *
   * If no `companyId` is specified in the cron subscription, the job
   * is launched for every company.
   *
   * @param id The cron subscription mongo id
   * @returns
   */
  public async launchCronSubscriptionJob(id: string) {
    const sub: CronSubscriptionsDocument =
      await this.subscriptionModel.findById(id);

    if (!sub) {
      this.logger.warn(
        `Cron subscription id '${id}' does not exist. Could not launch a job from non-existant cron subscription`,
      );
      return;
    }

    if (sub.jobName === CustomJob.name) {
      sub.jobParameters =
        await SubscriptionsUtils.getParametersForCustomJobSubscription(
          sub,
          this.logger,
          this.customJobsService,
          this.configService,
        );

      if (!sub.jobParameters) return;
    }

    // if no company id, it launches for all companies
    const companyIds = sub.companyId
      ? [sub.companyId.toString()]
      : await this.companyService.getAllIds();

    for (const companyId of companyIds) {
      const companyIdParameter = new JobParameter();
      companyIdParameter.name = 'companyId';
      companyIdParameter.value = companyId;
      sub.jobParameters.push(companyIdParameter);

      const job: Job = JobFactory.createJob(sub.jobName, sub.jobParameters);
      if (job != null) this.jobsService.publish(job);
    }
  }

  public async revertToDefaults(id: string): Promise<UpdateResult> {
    const sub = await this.subscriptionModel.findById(new Types.ObjectId(id));
    if (!sub) {
      throw new HttpNotFoundException('Subscription not found');
    }

    if (!(sub.builtIn && sub.file)) {
      throw new HttpBadRequestException('Subscription not suitable for revert');
    }

    const defaultSub = SubscriptionsUtils.readCronSubscriptionFile(
      CRON_SUBSCRIPTIONS_FILES_PATH,
      sub.file,
    );

    const subUpdate: Partial<CronSubscription> = {
      name: defaultSub.name,
      jobName: defaultSub.jobName,
      jobParameters: defaultSub.jobParameters,
      cronExpression: defaultSub.cronExpression,
    };

    return await this.subscriptionModel.updateOne(
      { _id: { $eq: sub._id } },
      subUpdate,
    );
  }
}
