import { Controller, Get, Logger, Put, UseGuards } from '@nestjs/common';
import { DevFeatureGuard } from '../../../../guards/dev-feature.guard';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@UseGuards(DevFeatureGuard)
@Controller('cron-subscriptions')
export class CronSubscriptionsController {
  private logger = new Logger(CronSubscriptionsController.name);

  constructor(
    private readonly cronSubscriptionsService: CronSubscriptionsService,
  ) {}

  @Get()
  async getCronSubscriptions(): Promise<any> {
    return await this.cronSubscriptionsService.getCronSubscriptions();
  }

  @Put('update-cache')
  async updateCache(): Promise<any> {
    return await this.cronSubscriptionsService.updateSubscriptionCache();
  }
}
