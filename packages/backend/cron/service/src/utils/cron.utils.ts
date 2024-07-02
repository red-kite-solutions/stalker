import { parseExpression } from 'cron-parser';

export function cronShouldRun(
  cronExpression: string,
  lastRunStart: number,
  currentRunStart: number,
): boolean {
  const parsedCron = parseExpression(cronExpression, {
    currentDate: new Date(currentRunStart),
  });
  const prevCronTime = parsedCron.prev().getTime();
  return lastRunStart <= prevCronTime && prevCronTime < currentRunStart;
}
