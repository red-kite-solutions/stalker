import { Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigModule } from './admin/config/config.module';
import { AlarmModule } from './alarm/alarm.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { CustomJobTemplateModule } from './custom-job-templates/custom-job-templates.module';
import { CustomJobsModule } from './custom-jobs/custom-jobs.module';
import { JobsModule } from './jobs/jobs.module';
import { ProjectModule } from './reporting/project.module';
import { SecretsModule } from './secrets/secrets.module';
import { CronSubscriptionsModule } from './subscriptions/cron-subscriptions/cron-subscriptions.module';
import { EventSubscriptionsModule } from './subscriptions/event-subscriptions/event-subscriptions.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TagsModule } from './tags/tag.module';

const mongooseModuleOptions: MongooseModuleOptions =
  process.env.JM_ENVIRONMENT === 'tests' && process.env.TEST_TYPE === 'unit'
    ? {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: process.env.MONGO_DATABASE_NAME,
        replicaSet: process.env.MONGO_REPLICA_SET_NAME,
      }
    : {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: process.env.MONGO_DATABASE_NAME,
        authSource: process.env.MONGO_DATABASE_NAME,
        replicaSet: process.env.MONGO_REPLICA_SET_NAME,
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        tlsCAFile: '/certs/ca.pem',
        tlsCertificateFile: '/certs/client-signed.crt',
        tlsCertificateKeyFile: '/certs/client.key',
        tlsCertificateKeyFilePassword: process.env.JM_MONGO_KEY_PASSWORD,
      };

@Module({
  imports: [
    MongooseModule.forRoot(
      `${process.env.MONGO_ADDRESS}`,
      mongooseModuleOptions,
    ),
    JobsModule,
    ProjectModule,
    ConfigModule,
    TagsModule,
    EventSubscriptionsModule,
    CronSubscriptionsModule,
    SubscriptionsModule,
    CustomJobsModule,
    SecretsModule,
    AlarmModule,
    CustomJobTemplateModule,
    ApiKeyModule,
  ],
  exports: [JobsModule],
  providers: [],
  controllers: [],
})
export class DatabaseModule {}
