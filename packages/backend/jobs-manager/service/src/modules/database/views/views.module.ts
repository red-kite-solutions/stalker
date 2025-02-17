import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { ViewController } from './views.controller';
import { ViewService } from './views.service';

@Module({
  imports: [DatalayerModule],
  controllers: [ViewController],
  providers: [ViewService],
  exports: [ViewService],
})
export class ViewModule {}
