import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../../admin/config/config.module';
import { JobsModule } from '../../jobs/jobs.module';
import { DomainsModule } from '../domain/domain.module';
import { ReportModule } from '../report/report.module';
import { HostController } from './host.controller';
import { HostSchema } from './host.model';
import { HostService } from './host.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'host',
        schema: HostSchema,
      },
    ]),
    JobsModule,
    ReportModule,
    ConfigModule,
    forwardRef(() => DomainsModule),
  ],
  controllers: [HostController],
  providers: [HostService],
  exports: [HostService],
})
export class HostModule {}
