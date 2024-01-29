import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  patchReq,
  postReq,
  putReq,
} from 'test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';
import { EventSubscriptionDto } from './event-subscriptions.dto';
import { EventSubscriptionsDocument } from './event-subscriptions.model';

describe('Event Subscriptions Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let projectName = 'subscriptionProject';
  let projectId: string;
  let subscriptionId: string;

  const subscription: EventSubscriptionDto = {
    name: 'My test subscription',
    finding: 'HostnameIpFinding',
    jobName: 'TcpPortScanningJob',
    jobParameters: [
      {
        name: 'targetIp',
        value: '${ip}',
      },
      {
        name: 'socketTimeoutSeconds',
        value: 1,
      },
      {
        name: 'thread',
        value: 10,
      },
      {
        name: 'portMin',
        value: 1,
      },
      {
        name: 'portMax',
        value: 1000,
      },
      {
        name: 'ports',
        value: '[1234, 3389, 8080]',
      },
    ],
    conditions: [
      {
        lhs: 'asdf',
        operator: 'contains',
        rhs: 'qwerty',
      },
    ],
    cooldown: 3600,
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
    await deleteReq(app, testData.user.token, `/project/${projectId}`);
    await app.close();
  });

  it('Should create an event subscription (POST /event-subscriptions)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/event-subscriptions', {
      projectId: projectId,
      ...subscription,
    });
    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    subscriptionId = r.body._id;
  });

  it('Should get the list of event subscriptions (GET /event-subscriptions)', async () => {
    // arrange & act
    const r = await getReq(app, testData.user.token, '/event-subscriptions');
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

  it('Should have proper authorizations (GET /event-subscriptions/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/event-subscriptions/507f1f77bcf86cd799439011`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should edit an event subscription (PUT /event-subscriptions/{id})', async () => {
    // arrange
    const changedName = 'My changed name';
    // act
    let r = await putReq(
      app,
      testData.user.token,
      `/event-subscriptions/${subscriptionId}`,
      {
        projectId: projectId,
        ...subscription,
        name: changedName,
      },
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.user.token, '/event-subscriptions');
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

  it('Should revert a built-in event subscription (PATCH /event-subscriptions/{id}?revert=true)', async () => {
    // Arrange
    let r = await getReq(app, testData.user.token, '/event-subscriptions');
    let builtInSub: EventSubscriptionsDocument;
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
      `/event-subscriptions/${builtInSub._id}?revert=true`,
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
      `/event-subscriptions/${builtInSub._id}?revert=true`,
      {},
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.user.token, '/event-subscriptions');
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

  it('Should delete a subscription by id (DELETE /event-subscriptions/{id})', async () => {
    // arrange & act
    const r = await deleteReq(
      app,
      testData.user.token,
      `/event-subscriptions/${subscriptionId}`,
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /event-subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/event-subscriptions`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /event-subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/event-subscriptions`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PUT /event-subscriptions/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await putReq(
          app,
          givenToken,
          `/event-subscriptions/${subscriptionId}`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PATCH /event-subscriptions/{id}?revert=true)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await patchReq(
          app,
          givenToken,
          `/event-subscriptions/${subscriptionId}?revert=true`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /event-subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/event-subscriptions/${subscriptionId}`,
        );
      },
    );
    expect(success).toBe(true);
  });
});
