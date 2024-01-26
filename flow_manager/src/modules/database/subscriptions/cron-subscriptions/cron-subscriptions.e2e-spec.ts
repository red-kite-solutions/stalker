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
  patchReq,
  postReq,
  putReq,
} from 'test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';
import {
  CronSubscription,
  CronSubscriptionsDocument,
} from './cron-subscriptions.model';

describe('Cron Subscriptions Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let projectName = 'CronSubscriptionProject';
  let projectId: string;
  let subscriptionId: string;

  const subscription: Partial<CronSubscription> = {
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

    let r = await postReq(app, testData.user.token, '/project', {
      name: projectName,
    });
    projectId = r.body._id;
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('Should create a cron subscription (POST /cron-subscriptions)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/cron-subscriptions', {
      projectId: projectId,
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
    let foundSubscription = false;
    for (const sub of r.body) {
      if (sub._id === subscriptionId) {
        foundSubscription = true;
        expect(sub.name).toBe(subscription.name);
      }
    }
    expect(foundSubscription).toBe(true);
  });

  it('Should edit a cron subscription (PUT /cron-subscriptions/{id})', async () => {
    // arrange
    const changedName = 'My changed name';
    // act
    let r = await putReq(
      app,
      testData.user.token,
      `/cron-subscriptions/${subscriptionId}`,
      {
        projectId: projectId,
        ...subscription,
        name: changedName,
      },
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.user.token, '/cron-subscriptions');
    expect(r.statusCode).toBe(HttpStatus.OK);
    let foundSubscription = false;
    for (const sub of r.body) {
      if (sub._id === subscriptionId) {
        foundSubscription = true;
        expect(sub.name).toBe(changedName);
      }
    }
    expect(foundSubscription).toBe(true);
  });

  it('Should revert a built-in cron subscription (PATCH /cron-subscriptions/{id}?revert=true)', async () => {
    // Arrange
    let r = await getReq(app, testData.user.token, '/cron-subscriptions');
    let builtInSub: CronSubscriptionsDocument;
    for (const sub of r.body) {
      if (sub.builtIn) {
        builtInSub = sub;
        break;
      }
    }

    const changedName = 'My changed name';
    r = await patchReq(
      app,
      testData.user.token,
      `/cron-subscriptions/${builtInSub._id}?revert=true`,
      {
        ...builtInSub,
        _id: null,
        builtIn: null,
        name: changedName,
      },
    );

    // Act
    r = await patchReq(
      app,
      testData.user.token,
      `/cron-subscriptions/${builtInSub._id}?revert=true`,
      {},
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.user.token, '/cron-subscriptions');
    expect(r.statusCode).toBe(HttpStatus.OK);

    let foundSubscription = false;
    for (const sub of r.body) {
      if (sub._id === builtInSub._id) {
        foundSubscription = true;
        expect(sub.name).not.toBe(changedName);
      }
    }
    expect(foundSubscription).toBe(true);
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

  it('Should have proper authorizations (PUT /cron-subscriptions/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await putReq(
          app,
          givenToken,
          `/cron-subscriptions/${subscriptionId}`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PATCH /cron-subscriptions/{id}?revert=true)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await patchReq(
          app,
          givenToken,
          `/cron-subscriptions/${subscriptionId}?revert=true`,
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
