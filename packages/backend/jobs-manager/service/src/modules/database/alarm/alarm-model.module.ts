import { MongooseModule } from '@nestjs/mongoose';
import { AlarmSchema } from './alarm.model';

export const AlarmModelModule = MongooseModule.forFeature([
  {
    name: 'alarms',
    schema: AlarmSchema,
  },
]);
