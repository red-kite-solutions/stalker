import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class DevFeatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (
      process.env.CRON_SERVICE_ENVIRONMENT !== 'tests' &&
      process.env.CRON_SERVICE_ENVIRONMENT !== 'dev'
    )
      return false;

    return true;
  }
}
