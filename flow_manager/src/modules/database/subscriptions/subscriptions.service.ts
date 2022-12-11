import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionDto } from './subscriptions.dto';
import { Subscription } from './subscriptions.model';

@Injectable()
export class SubscriptionsService {
  private logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel('subscriptions')
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  public async create(dto: SubscriptionDto) {
    await this.subscriptionModel.create(dto);
  }

  public async getAll() {
    return await this.subscriptionModel.find({});
  }

  public async edit(id: string, dto: SubscriptionDto) {
    return await this.subscriptionModel.updateOne(
      { _id: { $eq: new Types.ObjectId(id) } },
      dto,
    );
  }
}
