import { Module } from '@nestjs/common';
import { KeybaseModule } from '../../../alerts/keybase/keybase.module';
import { DatalayerModule } from '../../datalayer.module';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [KeybaseModule, DatalayerModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
