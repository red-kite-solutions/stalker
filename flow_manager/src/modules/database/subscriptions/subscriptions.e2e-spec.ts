import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  postReq,
  TestingData,
} from 'test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';

describe('Subscriptions Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let companyName = 'subscriptionCompany';
  let companyId: string;
  let subscriptionId: string;

  const subscription = {
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
    await app.close();
  });

  it('Should create a subscription (POST /subscriptions)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/subscriptions', {
      companyId: companyId,
      ...subscription,
    });
    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    subscriptionId = r.body._id;
  });

  it('Should get the list of subscriptions (GET /subscriptions)', async () => {
    // arrange & act
    const r = await getReq(app, testData.user.token, '/subscriptions');
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBe(subscriptionId);
    expect(r.body[0].name).toBe(subscription.name);
  });

  it('Should edit a subscription (POST /subscriptions/{id})', async () => {
    // arrange
    const changedName = 'My changed name';
    // act
    let r = await postReq(
      app,
      testData.user.token,
      `/subscriptions/${subscriptionId}`,
      {
        companyId: companyId,
        ...subscription,
        name: changedName,
      },
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);

    r = await getReq(app, testData.user.token, '/subscriptions');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBe(subscriptionId);
    expect(r.body[0].name).toBe(changedName);
  });

  it('Should delete a subscription by id (DELETE /subscriptions/{id})', async () => {
    // arrange & act
    const r = await deleteReq(
      app,
      testData.user.token,
      `/subscriptions/${subscriptionId}`,
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/subscriptions`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/subscriptions`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /subscriptions/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/subscriptions/${subscriptionId}`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /subscriptions)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/subscriptions/${subscriptionId}`,
        );
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await deleteReq(app, testData.user.token, `/company/${companyId}`);
    await app.close();
  });
});
