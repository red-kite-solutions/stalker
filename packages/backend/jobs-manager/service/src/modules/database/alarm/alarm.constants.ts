import { Alarm } from './alarm.model';

export const DEFAULT_ALARMS: Alarm[] = [
  {
    name: 'Clear job runs',
    cronExpression: '0 0 * * *',
    isEnabled: true,
    path: '/jobs/cleanup',
  },
  {
    name: 'Clear findings',
    cronExpression: '0 0 * * *',
    isEnabled: true,
    path: '/findings/cleanup',
  },
  {
    name: 'Clear finding definitions',
    cronExpression: '0 0 * * *',
    isEnabled: true,
    path: '/finding-definitions/cleanup',
  },
];
