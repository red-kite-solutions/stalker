import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HostController } from './host.controller';
import { HostSchema } from './host.model';
import { HostService } from './host.service';
import { JobsModule } from '../../jobs/jobs.module';
import { CompanyModule } from '../company.module';
import { ReportModule } from '../report/report.module';
import { ConfigModule } from '../../admin/config/config.module';
import { DomainsModule } from '../domain/domain.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'host',
        schema: HostSchema,
      },
    ]),
    JobsModule,
    CompanyModule,
    ReportModule,
    ConfigModule,
    DomainsModule,
  ],
  controllers: [HostController],
  providers: [HostService],
  exports: [],
})
export class HostModule {}
