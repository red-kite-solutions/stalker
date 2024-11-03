import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class CronApiTokenGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    return (
      headers &&
      headers['x-stalker-cron'] &&
      headers['x-stalker-cron'] === process.env.RK_CRON_API_TOKEN
    );
  }
}
