import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { TableController } from './tables.controller';
import { TableService } from './tables.service';

@Module({
  imports: [DatalayerModule],
  controllers: [TableController],
  providers: [TableService],
  exports: [TableService],
})
export class ViewModule {}
