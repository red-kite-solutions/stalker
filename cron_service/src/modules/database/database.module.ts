import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronSubscriptionsModule } from './subscriptions/cron-subscriptions/cron-subscriptions.module';

@Module({
  imports: [
    MongooseModule.forRoot(`${process.env.MONGO_ADDRESS}`, {
      dbName: process.env.MONGO_DATABASE_NAME,
      replicaSet: process.env.MONGO_REPLICA_SET_NAME,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: true,
      tlsCAFile: '/certs/ca.pem',
      tlsCertificateFile: '/certs/client-signed.crt',
      tlsCertificateKeyFile: '/certs/client.key',
      tlsCertificateKeyFilePassword:
        process.env.CRON_SERVICE_MONGO_KEY_PASSWORD,
    }),
    CronSubscriptionsModule,
  ],
  exports: [],
})
export class DatabaseModule {}
