import { Module } from '@nestjs/common';
import { DatalayerModule } from '../datalayer.module';
import { ContainerController } from './container.controller';
import { containerInitProvider } from './container.provider';
import { ContainerService } from './container.service';

@Module({
  imports: [DatalayerModule],
  controllers: [ContainerController],
  providers: [ContainerService, ...containerInitProvider],
  exports: [ContainerService, ...containerInitProvider],
})
export class ContainerModule {}
