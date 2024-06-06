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
      const anyAlarm = await alarmModel.findOne({});
      if (anyAlarm) return;

      for (let alarm of DEFAULT_ALARMS) {
        await alarmModel.create(alarm);
      }
    },
  },
];
