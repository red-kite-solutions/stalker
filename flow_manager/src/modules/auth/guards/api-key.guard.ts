import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { API_KEY } from '../constants';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    return request?.headers?.api_key === API_KEY;
  }
}
