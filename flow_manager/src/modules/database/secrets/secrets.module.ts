import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { SecretsController } from './secrets.controller';
import { SecretsService } from './secrets.service';

@Module({
  imports: [DatalayerModule],
  providers: [SecretsService],
  controllers: [SecretsController],
  exports: [SecretsService],
})
export class SecretsModule {}
