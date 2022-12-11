import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSubscriptionDto } from './subscriptions.dto';
import { Subscription } from './subscriptions.model';

@Injectable()
export class SubscriptionsService {
  private logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel('subscriptions')
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  public async create(dto: CreateSubscriptionDto) {
    await this.subscriptionModel.create(dto);
  }

  public async getAll() {
    return await this.subscriptionModel.find({});
  }
}
