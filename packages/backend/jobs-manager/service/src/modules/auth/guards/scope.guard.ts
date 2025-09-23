import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserAuthContext } from '../auth.types';
import { canActivateScopes } from '../utils/auth.utils';
import { getRequiredScopes } from './scope-guard.utils';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = getRequiredScopes(this.reflector, context);

    if (!requiredScopes.scopes.length) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserAuthContext = request.user;

    return canActivateScopes(
      requiredScopes.scopes,
      user.scopes,
      requiredScopes.scopeOptions,
    );
  }
}
