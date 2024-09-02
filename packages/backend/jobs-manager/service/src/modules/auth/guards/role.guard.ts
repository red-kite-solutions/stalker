import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserAuthContext } from '../auth.types';
import { Role, roleIsAuthorized } from '../constants';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // This code gets the role given in the decorator roles.decorator.ts, ex: @Roles(Role.User) (requiredRole)
    // It is then validated against the role contained in the user's JWT  (user.role)
    const requiredRole = this.reflector.getAllAndOverride<Role>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserAuthContext = request.user;

    return roleIsAuthorized(user.role, requiredRole);
  }
}
