import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { canActivateScopes } from '../utils/auth.utils';
import { getRequiredScopes } from './scope-guard.utils';

@Injectable()
export class ScopesSocketioGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = getRequiredScopes(this.reflector, context);

    if (!requiredScopes.scopes.length) {
      return false;
    }

    const handshake = context.switchToWs().getClient().handshake;
    const user = handshake.user;

    return canActivateScopes(
      requiredScopes.scopes,
      user.scopes,
      requiredScopes.scopeOptions,
    );
  }
}
