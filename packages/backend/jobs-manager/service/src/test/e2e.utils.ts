import { HttpStatus, INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import jwt_decode from 'jwt-decode';
import { MongoClient, MongoClientOptions } from 'mongodb';
import * as request from 'supertest';
import { JM_ENVIRONMENTS } from '../modules/app.constants';
import { Role } from '../modules/auth/constants';
import { ProjectDocument } from '../modules/database/reporting/project.model';

export interface UserTestingData {
  token: string;
  refresh: string;
  email: string;
  password: string;
  role: string;
  id: string;
  firstName: string;
  lastName: string;
}

export interface TestingData {
  readonly: UserTestingData;
  user: UserTestingData;
  admin: UserTestingData;
}

const user: Partial<UserTestingData> = {
  email: 'user@stalker.is',
  password: 'user@stalker.is',
  role: Role.User,
  firstName: 'firstUser',
  lastName: 'lastUser',
};

const readonly: Partial<UserTestingData> = {
  email: 'readonly@stalker.is',
  password: 'readonly@stalker.is',
  role: Role.ReadOnly,
  firstName: 'firstReadonly',
  lastName: 'lastReadonly',
};

export const admin: Partial<UserTestingData> = {
  email: 'admin@stalker.is',
  password: 'admin',
  role: Role.Admin,
  firstName: 'stalker',
  lastName: 'admin',
};

export async function login(
  app: INestApplication,
  email: string,
  password: string,
) {
  return await request(app.getHttpServer())
    .post('/auth/login')
    .set('Content-Type', 'application/json')
    .send({
      email: email,
      password: password,
    });
}

export async function createUser(
  app: INestApplication,
  token: string,
  user: any,
) {
  return await postReq(app, token, '/users', {
    currentPassword: admin.password,
    ...user,
  });
}

export async function initTesting(app: INestApplication): Promise<TestingData> {
  const adminRes = await login(app, admin.email, admin.password);

  const adminData: UserTestingData = {
    token: adminRes.body.access_token,
    refresh: adminRes.body.refresh_token,
    id: (jwt_decode(adminRes.body.access_token) as any).id,
    ...admin,
  } as UserTestingData;

  await createUser(app, adminData.token, {
    email: user.email,
    password: user.password,
    active: true,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  const userRes = await login(app, user.email, user.password);

  const userData: UserTestingData = {
    token: userRes.body.access_token,
    refresh: userRes.body.refresh_token,
    id: (jwt_decode(userRes.body.access_token) as any).id,
    ...user,
  } as UserTestingData;

  await createUser(app, adminData.token, {
    email: readonly.email,
    password: readonly.password,
    active: true,
    role: readonly.role,
    firstName: readonly.firstName,
    lastName: readonly.lastName,
  });

  const readonlyRes = await login(app, readonly.email, readonly.password);

  const readOnlyData: UserTestingData = {
    token: readonlyRes.body.access_token,
    refresh: readonlyRes.body.refresh_token,
    id: (jwt_decode(readonlyRes.body.access_token) as any).id,
    ...readonly,
  } as UserTestingData;

  return {
    admin: adminData,
    user: userData,
    readonly: readOnlyData,
  };
}

export async function getReq(
  app: INestApplication,
  token: string,
  path: string,
  headers: { header: string; value: string }[] = [
    { header: 'Content-Type', value: 'application/json' },
  ],
  authenticate: boolean = true,
) {
  return await testRequest(
    'get',
    app,
    token,
    path,
    null,
    headers,
    authenticate,
  );
}

export async function postReq(
  app: INestApplication,
  token: string,
  path: string,
  data?: any,
  headers: { header: string; value: string }[] = [
    { header: 'Content-Type', value: 'application/json' },
  ],
  authenticate: boolean = true,
) {
  return await testRequest(
    'post',
    app,
    token,
    path,
    data,
    headers,
    authenticate,
  );
}

export async function putReq(
  app: INestApplication,
  token: string,
  path: string,
  data: any,
  headers: { header: string; value: string }[] = [
    { header: 'Content-Type', value: 'application/json' },
  ],
  authenticate: boolean = true,
) {
  return await testRequest(
    'put',
    app,
    token,
    path,
    data,
    headers,
    authenticate,
  );
}

export async function patchReq(
  app: INestApplication,
  token: string,
  path: string,
  data: any,
  headers: { header: string; value: string }[] = [
    { header: 'Content-Type', value: 'application/json' },
  ],
  authenticate: boolean = true,
) {
  return await testRequest(
    'patch',
    app,
    token,
    path,
    data,
    headers,
    authenticate,
  );
}

export async function deleteReq(
  app: INestApplication,
  token: string,
  path: string,
  data: any = null,
  headers: { header: string; value: string }[] = [
    { header: 'Content-Type', value: 'application/json' },
  ],
  authenticate: boolean = true,
) {
  return await testRequest(
    'delete',
    app,
    token,
    path,
    data,
    headers,
    authenticate,
  );
}

async function testRequest(
  verb: 'get' | 'post' | 'put' | 'patch' | 'delete',
  app: INestApplication,
  token: string,
  path: string,
  data: any = null,
  headers: { header: string; value: string }[] = [
    { header: 'Content-Type', value: 'application/json' },
  ],
  authenticate: boolean = true,
) {
  let r: request.Test;
  const server = request(app.getHttpServer());

  switch (verb) {
    case 'get':
      r = server.get(path);
      break;
    case 'post':
      r = server.post(path);
      break;
    case 'put':
      r = server.put(path);
      break;
    case 'patch':
      r = server.patch(path);
      break;
    case 'delete':
      r = server.delete(path);
      break;
    default:
      throw new Error();
  }

  for (const h of headers) {
    r.set(h.header, h.value);
  }

  if (authenticate) {
    r.set('Authorization', `Bearer ${token}`);
  }

  if (data) return await r.send(data);
  return await r;
}

/**
 * Automatically runs a test with the different valid authorization levels and
 * returns true if the authorizations were properly checked. Used to check authorizations
 * on a controller endpoint.
 * @param data The test data that includes valid user tokens.
 * @param role The role that the controller endpoint is supposed to respect. null for no authentication required
 * @param call The function to call. Takes a bearer token as parameter. Returns a supertest Response
 * @returns true if authorization reflects the given role, false otherwise
 */
export async function checkAuthorizations(
  data: TestingData,
  role: Role,
  call: (token: string, password: string) => Promise<request.Response>,
): Promise<boolean> {
  let r = await call(data.admin.token, data.admin.password);

  if (r.statusCode === HttpStatus.UNAUTHORIZED) {
    return false;
  }

  r = await call(data.user.token, data.user.password);
  if (
    (r.statusCode !== HttpStatus.UNAUTHORIZED && role === Role.Admin) ||
    (r.statusCode === HttpStatus.UNAUTHORIZED &&
      (role === Role.User || role === Role.ReadOnly))
  ) {
    return false;
  }

  r = await call(data.readonly.token, data.readonly.password);
  if (
    (r.statusCode !== HttpStatus.UNAUTHORIZED &&
      (role === Role.Admin || role === Role.User)) ||
    (r.statusCode === HttpStatus.UNAUTHORIZED && role === Role.ReadOnly)
  ) {
    return false;
  }

  // Checks if the call is accessible without a token
  r = await call('', '');
  if (
    (r.statusCode !== HttpStatus.UNAUTHORIZED && role !== null) ||
    (r.statusCode === HttpStatus.UNAUTHORIZED && role === null)
  ) {
    return false;
  }

  return true;
}

export async function checkAuthorizationsCronApiKey(
  data: TestingData,
  call: (
    token: string,
    headers: { header: string; value: string }[],
    authenticate: boolean,
  ) => Promise<request.Response>,
) {
  let r = await call(data.admin.token, undefined, undefined);
  if (r.statusCode !== HttpStatus.FORBIDDEN) return false;

  r = await call(data.user.token, undefined, undefined);
  if (r.statusCode !== HttpStatus.FORBIDDEN) return false;

  r = await call(data.readonly.token, undefined, undefined);
  if (r.statusCode !== HttpStatus.FORBIDDEN) return false;

  r = await call('', undefined, undefined);
  if (r.statusCode !== HttpStatus.FORBIDDEN) return false;

  const cronHeaderName = 'x-stalker-cron';
  const headers = [{ header: 'Content-Type', value: 'application/json' }];
  r = await call(
    null,
    headers.concat([{ header: cronHeaderName, value: 'asdf' }]),
    false,
  );
  if (r.statusCode !== HttpStatus.FORBIDDEN) return false;

  r = await call(
    null,
    headers.concat([
      { header: cronHeaderName, value: process.env.STALKER_CRON_API_TOKEN },
    ]),
    false,
  );
  if (r.statusCode === HttpStatus.FORBIDDEN) return false;
}

export async function createProject(
  app,
  testData: TestingData,
  projectName = null,
): Promise<ProjectDocument> {
  const res = await postReq(app, testData.user.token, '/project', {
    name: projectName ?? 'e2e-tests-' + randomUUID(),
  });

  expect(res.statusCode).toBe(201);
  res.body._id = `${res.body._id}`;
  return res.body;
}

export async function createDomain(
  app,
  testData: TestingData,
  projectId: string,
  domains: string[],
) {
  const r = await postReq(app, testData.admin.token, `/domains`, {
    domains: domains,
    projectId: projectId,
  });

  return r.body;
}

export async function createHosts(
  app,
  testData: TestingData,
  projectId: string,
  ips: string[],
) {
  const r = await postReq(app, testData.admin.token, `/hosts`, {
    ips: ips,
    projectId: projectId,
  });
  return r.body;
}

export async function createTag(
  app,
  testData: TestingData,
  name: string,
  color = '#123123',
) {
  const r = await postReq(app, testData.admin.token, `/tags/`, {
    text: name,
    color: color,
  });
  return r.body;
}

export async function cleanup() {
  if (process.env.JM_ENVIRONMENT !== JM_ENVIRONMENTS.tests) {
    console.error('Cannot wipe data if not in TEST mode.');
    return;
  }

  const uri = process.env.MONGO_ADDRESS;
  const database = process.env.MONGO_DATABASE_NAME;
  const opt: MongoClientOptions = {
    authSource: process.env.MONGO_DATABASE_NAME,
    replicaSet: process.env.MONGO_REPLICA_SET_NAME,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    tlsCAFile: '/certs/ca.pem',
    tlsCertificateFile: '/certs/client-signed.crt',
    tlsCertificateKeyFile: '/certs/client.key',
    tlsCertificateKeyFilePassword: process.env.JM_MONGO_KEY_PASSWORD,
  };
  const client = new MongoClient(uri, opt);
  await client.connect();
  const db = client.db(database);

  const collectionsToDelete = [
    'jobs',
    'domains',
    'hosts',
    'projects',
    'tags',
    'reports',
    'cronsubscriptions',
    'eventsubscriptions',
    'customjobs',
    'jobs',
    'secrets',
  ];

  const promises = collectionsToDelete.map(async (c) => {
    try {
      await db.dropCollection(c);
    } catch (e) {
      // Do nothing, the collection probably does not exist.
    }
  });

  await Promise.all(promises);

  await client.close();
}
