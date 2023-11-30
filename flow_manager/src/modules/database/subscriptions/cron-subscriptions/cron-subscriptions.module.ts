import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../../admin/config/config.module';
import { CustomJobsModule } from '../../custom-jobs/custom-jobs.module';
import { CompanyModule } from '../../reporting/company.module';
import { CronSubscriptionsController } from './cron-subscriptions.controller';
import { CronSubscriptionsSchema } from './cron-subscriptions.model';
import { CronSubscriptionsService } from './cron-subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'cronSubscriptions',
        schema: CronSubscriptionsSchema,
      },
    ]),
    CompanyModule,
    CustomJobsModule,
    ConfigModule,
  ],
  controllers: [CronSubscriptionsController],
  providers: [CronSubscriptionsService],
  exports: [CronSubscriptionsService],
})
export class CronSubscriptionsModule {}
