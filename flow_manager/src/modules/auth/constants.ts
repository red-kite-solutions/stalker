export const jwtConstants = {
  secret: process.env['FM_JWT_SECRET'],
  expirationTime: '300s',
};

export const rtConstants = {
  secret: process.env['FM_REFRESH_SECRET'],
  expirationTime: '25200s',
};

export const orchestratorConstants = {
  clientId: 'flow-manager',
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
