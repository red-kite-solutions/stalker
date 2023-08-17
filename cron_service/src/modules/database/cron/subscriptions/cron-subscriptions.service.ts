import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CronSubscription } from './cron-subscriptions.model';

@Injectable()
export class CronSubscriptionsService {
  constructor(
    @InjectModel('cronSubscriptions')
    private readonly cronSubscriptionsModel: Model<CronSubscription>,
  ) {}

  public async getCronSubscriptions() {
    return await this.cronSubscriptionsModel.find({});
  }
}
