import { UnauthorizedException } from '@nestjs/common';

export const jwtConstants = {
  secret: process.env['JM_JWT_SECRET'],
  expirationTime: '300s',
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
  },
};

export enum Role {
  User = 'user',
  Admin = 'admin',
  ReadOnly = 'read-only',
}

export function roleIsAuthorized(role: string, requiredRole: string): boolean {
  if (role === Role.Admin) return true;
  if (
    role === Role.User &&
    (requiredRole === Role.ReadOnly || requiredRole === Role.User)
  )
    return true;

  if (role !== requiredRole) throw new UnauthorizedException();

  return true;
}
