import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import jwt_decode from 'jwt-decode';
import * as request from 'supertest';
import {
  admin,
  createUser,
  deleteReq,
  login,
  putReq,
} from '../../test/e2e.utils';
import { AppModule } from '../app.module';
import { Role } from './constants';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let refresh: string;

  const testAdmin = {
    email: `testadmin-${randomUUID()}@stalker.is`,
    password: 'testadmin@stalker.is',
    role: Role.Admin,
    firstName: 'testadminfirst',
    lastName: 'testadminlast',
    active: true,
    id: null,
  };

  const inactiveUser = {
    email: `inactive-${randomUUID()}@stalker.is`,
    password: 'inactive@stalker.is',
    role: Role.Admin,
    firstName: 'InactiveFirst',
    lastName: 'InactiveLast',
    active: false,
    id: null,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    let r = await login(app, admin.email, admin.password);
    let initToken = r.body.access_token;
    r = await createUser(app, initToken, inactiveUser);
    if (r.statusCode === HttpStatus.CREATED) {
      inactiveUser.id = r.body._id;
    }

    r = await createUser(app, initToken, testAdmin);
    if (r.statusCode === HttpStatus.CREATED) {
      testAdmin.id = r.body._id;
    }
  });

  it('Should fail to login with bad credentials (POST /auth/login)', async () => {
    const r = await login(app, 'email@example.com', 'password');

    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should connect as the admin user (POST /auth/login)', async () => {
    const r = await login(app, testAdmin.email, testAdmin.password);

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body.access_token).toBeTruthy();
    expect(r.body.refresh_token).toBeTruthy();
    const decodedToken: any = jwt_decode(r.body.access_token);
    const decodedRefresh: any = jwt_decode(r.body.refresh_token);
    expect(decodedToken.id).toBeTruthy();
    expect(decodedToken.email).toBe(testAdmin.email);
    expect(decodedToken.role).toBe(testAdmin.role);
    expect(decodedRefresh.id).toBeTruthy();
    expect(decodedToken.exp < decodedRefresh.exp).toBeTruthy();

    token = r.body.access_token;
    refresh = r.body.refresh_token;
  });

  it('Should provide an access token with a valid refresh token (PUT /auth/refresh)', async () => {
    const r = await request(app.getHttpServer())
      .put('/auth/refresh')
      .set('Content-Type', 'application/json')
      .send({
        refresh_token: refresh,
      });

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.access_token).toBeTruthy();
    const decodedToken: any = jwt_decode(r.body.access_token);
    expect(decodedToken.id).toBeTruthy();
    expect(decodedToken.email).toBe(testAdmin.email);
    expect(decodedToken.role).toBe(testAdmin.role);
  });

  it('Should ping the server on an authenticated route (GET /ping)', async () => {
    const r = await request(app.getHttpServer())
      .get('/ping')
      .set({ Authorization: `Bearer ${token}` });

    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should logout properly (DELETE /auth/logout)', async () => {
    const r = await request(app.getHttpServer())
      .delete('/auth/logout')
      .set({ Authorization: `Bearer ${token}` });

    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should not be able to get an access token with a refresh token after logout (PUT /auth/refresh)', async () => {
    const r = await request(app.getHttpServer())
      .put('/auth/refresh')
      .set('Content-Type', 'application/json')
      .send({
        refresh_token: refresh,
      });

    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should not be able to login with an inactive user (POST /auth/login)', async () => {
    const r = await login(app, inactiveUser.email, inactiveUser.password);
    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  it("Should not be able to get an access token with a deactivated user's refresh token (PUT /auth/refresh)", async () => {
    await putReq(app, token, `/users/${inactiveUser.id}`, {
      email: inactiveUser.email,
      firstName: inactiveUser.firstName,
      lastName: inactiveUser.lastName,
      active: true,
      currentPassword: testAdmin.password,
    });
    const inactiveTokens = (
      await login(app, inactiveUser.email, inactiveUser.password)
    ).body;

    expect(inactiveTokens.access_token).toBeTruthy();

    await putReq(app, token, `/users/${inactiveUser.id}`, {
      email: inactiveUser.email,
      firstName: inactiveUser.firstName,
      lastName: inactiveUser.lastName,
      active: false,
      currentPassword: testAdmin.password,
    });
    const r = await request(app.getHttpServer())
      .put('/auth/refresh')
      .set('Content-Type', 'application/json')
      .send({
        refresh_token: inactiveTokens.refresh_token,
      });

    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  afterAll(async () => {
    await deleteReq(app, token, `/users/${inactiveUser.id}`);
    await deleteReq(app, token, `/users/${testAdmin.id}`);
    await app.close();
  });
});
