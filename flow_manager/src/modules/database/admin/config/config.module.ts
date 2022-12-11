import { Module } from '@nestjs/common';
import { DatalayerModule } from '../../datalayer.module';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  imports: [DatalayerModule],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
