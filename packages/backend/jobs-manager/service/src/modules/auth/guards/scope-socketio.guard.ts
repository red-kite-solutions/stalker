import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';
import { userHasScope } from '../utils/auth.utils';

@Injectable()
export class ScopesSocketioGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // This code gets the scope given in the decorator scopes.decorator.ts, ex: @Scopes(['manage:users:update'])
    // It is then validated against the scopes contained in the user's JWT  (user.role)
    const requiredScope = this.reflector.getAllAndOverride<string>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScope) {
      return false;
    }

    let requiredScopesArray = [];
    if (Array.isArray(requiredScope)) {
      requiredScopesArray = requiredScope;
    } else {
      requiredScopesArray.push(requiredScope);
    }

    const handshake = context.switchToWs().getClient().handshake;
    const user = handshake.user;

    // If user has any of the scopes required, the request can go through
    for (const scope of requiredScopesArray)
      if (userHasScope(scope, user.scopes)) return true;

    return false;
  }
}
