import { UnauthorizedException } from '@nestjs/common';

export const jwtConstants = {
  secret: process.env['JM_JWT_SECRET'],
  expirationTime: '300s',
};

export const resetPasswordConstants = {
  expirationTimeSeconds: 3600,
};

export const rtConstants = {
  secret: process.env['JM_REFRESH_SECRET'],
  expirationTime: '25200s',
};

export const orchestratorConstants = {
  clientId: 'jobs-manager',
  brokers: [process.env['KAFKA_URI']],
  topics: {
    jobRequests: 'stalker.jobs.requests',
    findings: 'stalker.jobs.findings',
    jobLogs: 'stalker.jobs.logs',
    jobModels: 'stalker.jobs.models',
  },
};

export enum Role {
  User = 'user',
  UserResetPassword = 'user-reset-password',
  Admin = 'admin',
  ReadOnly = 'read-only',
}

export function roleIsAuthorized(
  userRole: string,
  requiredRole: string,
): boolean {
  const allowedRoles = expandRole(userRole);

  if (!allowedRoles.includes(requiredRole)) throw new UnauthorizedException();

  return true;
}

/** Returns all the roles allowed by the given role. */
function expandRole(role: string): string[] {
  switch (role) {
    case Role.Admin:
      return [Role.Admin, Role.User, Role.ReadOnly, Role.UserResetPassword];

    case Role.User:
      return [Role.User, Role.ReadOnly, Role.UserResetPassword];

    case Role.ReadOnly:
      return [Role.ReadOnly, Role.UserResetPassword];

    case Role.UserResetPassword:
      return [Role.UserResetPassword];

    default:
      return [];
  }
}
