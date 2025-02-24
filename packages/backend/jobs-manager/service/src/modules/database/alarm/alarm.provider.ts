import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_ALARMS } from './alarm.constants';
import { Alarm } from './alarm.model';

export const ALARM_INIT = 'ALARM_INIT';

export const alarmInitProvider = [
  {
    provide: ALARM_INIT,
    inject: [getModelToken('alarms')],
    useFactory: async (alarmModel: Model<Alarm>) => {
      const allAlarms = await alarmModel.find({});
      for (let alarm of DEFAULT_ALARMS) {
        if (allAlarms.find((a) => a.name === alarm.name)) continue;

        await alarmModel.create(alarm);
      }
    },
  },
];
