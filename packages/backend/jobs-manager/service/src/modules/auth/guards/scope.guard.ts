import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserAuthContext } from '../auth.types';
import { SCOPES_KEY } from '../decorators/scopes.decorator';
import { userHasScope } from '../utils/auth.utils';

@Injectable()
export class ScopesGuard implements CanActivate {
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

    const request = context.switchToHttp().getRequest();
    const user: UserAuthContext = request.user;

    return userHasScope(requiredScope, user.scopes);
  }
}
