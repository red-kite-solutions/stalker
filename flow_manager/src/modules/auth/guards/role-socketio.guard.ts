import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, roleIsAuthorized } from '../constants';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesSocketioGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<Role>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    const handshake = context.switchToWs().getClient().handshake;
    const user = handshake.user;

    return roleIsAuthorized(user.role, requiredRole);
  }
}
