import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectorModule } from '../../connectors/connector.module';
import { AlarmController } from './alarm.controller';
import { AlarmSchema } from './alarm.model';
import { AlarmService } from './alarm.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'alarms',
        schema: AlarmSchema,
      },
    ]),
    ConnectorModule,
  ],
  providers: [AlarmService],
  controllers: [AlarmController],
  exports: [AlarmService],
})
export class AlarmModule {}
