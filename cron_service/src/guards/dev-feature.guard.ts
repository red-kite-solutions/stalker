import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class DevFeatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return (
      process.env.CRON_SERVICE_ENVIRONMENT === 'tests' ||
      process.env.CRON_SERVICE_ENVIRONMENT === 'dev'
    );
  }
}
