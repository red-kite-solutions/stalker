import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../../admin/config/config.module';
import { JobsModule } from '../../jobs/jobs.module';
import { HostModule } from '../host/host.module';
import { ReportModule } from '../report/report.module';
import { DomainsController } from './domain.controller';
import { DomainSchema } from './domain.model';
import { DomainsService } from './domain.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'domain',
        schema: DomainSchema,
      },
    ]),
    JobsModule,
    ReportModule,
    ConfigModule,
    forwardRef(() => HostModule),
  ],
  controllers: [DomainsController],
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
