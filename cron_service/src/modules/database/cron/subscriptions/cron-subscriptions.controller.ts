import { Controller, Get, Logger } from '@nestjs/common';
import { HttpRouteNotAvailableException } from '../../../../exceptions/http.exceptions';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Controller('cron/subscriptions')
export class CronSubscriptionsController {
  private logger = new Logger(CronSubscriptionsController.name);

  constructor(
    private readonly cronSubscriptionsService: CronSubscriptionsService,
  ) {}

  @Get()
  async getCronSubscriptions(): Promise<any> {
    /////////////////////////////////////////////
    // TODO: Make a guard out of this, or rework
    /////////////////////////////////////////////
    if (
      process.env.CRON_SERVICE_ENVIRONMENT !== 'tests' &&
      process.env.CRON_SERVICE_ENVIRONMENT !== 'dev'
    ) {
      throw new HttpRouteNotAvailableException();
    }

    return await this.cronSubscriptionsService.getCronSubscriptions();
  }
}
