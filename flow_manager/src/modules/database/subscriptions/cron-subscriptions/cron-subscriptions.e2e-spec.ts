import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  TestingData,
  checkAuthorizations,
  cleanup,
  deleteReq,
  getReq,
  initTesting,
  postReq,
} from 'test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';
import { CronSubscription } from './cron-subscriptions.model';

describe('Cron Subscriptions Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let companyName = 'CronSubscriptionCompany';
  let companyId: string;
  let subscriptionId: string;

  const subscription: CronSubscription = {
    name: 'My test subscription',
    cronExpression: '*/5 * * * *',
    jobName: 'DomainNameResolvingJob',
    jobParameters: [
      {
        name: 'domainName',
        value: 'example.com',
      },
    ],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    testData = await initTesting(app);

    let r = await postReq(app, testData.user.token, '/company', {
      name: companyName,
    });
    companyId = r.body._id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('Should create a cron subscription (POST /cron-subscriptions)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/cron-subscriptions', {
      companyId: companyId,
      ...subscription,
    });
    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    subscriptionId = r.body._id;
  });

  it('Should get the list of cron subscriptions (GET /cron-subscriptions)', async () => {
    // arrange & act
    const r = await getReq(app, testData.user.token, '/cron-subscriptions');
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBe(subscriptionId);
    expect(r.body[0].name).toBe(subscription.name);
  });

  it('Should edit a cron subscription (POST /cron-subscriptions/{id})', async () => {
    // arrange
    const changedName = 'My changed name';
    // act
    let r = await postReq(
      app,
      testData.user.token,
      `/cron-subscriptions/${subscriptionId}`,
      {
        companyId: companyId,
        ...subscription,
        name: changedName,
      },
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);

    r = await getReq(app, testData.user.token, '/cron-subscriptions');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBe(subscriptionId);
    expect(r.body[0].name).toBe(changedName);
  });

  it('Should delete a subscription by id (DELETE /cron-subscriptions/{id})', async () => {
    // arrange & act
    const r = await deleteReq(
      app,
      testData.user.token,
      `/cron-subscriptions/${subscriptionId}`,
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /cron-subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/cron-subscriptions`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /cron-subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/cron-subscriptions`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /cron-subscriptions/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/cron-subscriptions/${subscriptionId}`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /cron-subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/cron-subscriptions/${subscriptionId}`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /cron-subscriptions/{id}/notify)', async () => {
    // Arrange
    const path = `/cron-subscriptions/${subscriptionId}/notify`;

    // Act & Assert
    const call = async (givenToken: string) => {
      return await postReq(app, givenToken, path);
    };

    let r = await call(testData.admin.token);
    expect(r.statusCode).toStrictEqual(HttpStatus.FORBIDDEN);

    r = await call(testData.user.token);
    expect(r.statusCode).toStrictEqual(HttpStatus.FORBIDDEN);

    r = await call(testData.readonly.token);
    expect(r.statusCode).toStrictEqual(HttpStatus.FORBIDDEN);

    r = await call('');
    expect(r.statusCode).toStrictEqual(HttpStatus.FORBIDDEN);

    r = await request(app.getHttpServer())
      .post(path)
      .set('Content-Type', 'application/json')
      .set('x-stalker-cron', `asdf`)
      .send({});
    expect(r.statusCode).toStrictEqual(HttpStatus.FORBIDDEN);

    r = await request(app.getHttpServer())
      .post(path)
      .set('Content-Type', 'application/json')
      .set('x-stalker-cron', process.env.STALKER_CRON_API_TOKEN)
      .send({});
    expect(r.statusCode !== HttpStatus.FORBIDDEN).toStrictEqual(true);
  });
});