import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app.module';
import { Role } from 'src/modules/auth/constants';
import {
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  postReq,
  TestingData,
} from 'test/e2e.utils';

describe('Host Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const companyName = 'StalkerHost';
  let host = '127.0.0.127';
  let hostId: string;
  let companyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
    companyId = (
      await postReq(app, testData.admin.token, '/company', {
        name: companyName,
      })
    ).body._id;
  });

  it('Should create a host (POST /company/:id/host)', async () => {
    // Arrange & Act
    const r = await postReq(
      app,
      testData.admin.token,
      `/company/${companyId}/host`,
      { ips: [host] },
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body[0]._id).toBeTruthy();
    hostId = r.body[0]._id;
  });

  it('Should get a host by id (GET /hosts/:id)', async () => {
    // Arrange & Act
    const r = await getReq(app, testData.admin.token, `/hosts/${hostId}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body._id).toBeTruthy();
    expect(r.body._id).toStrictEqual(hostId);
  });

  it('Should get a the top 10 TCP ports of a host without ports (GET /hosts/:id/top-tcp-ports/:top)', async () => {
    // Arrange & Act
    const r = await getReq(
      app,
      testData.admin.token,
      `/hosts/${hostId}/top-tcp-ports/10`,
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toStrictEqual(0);
  });

  it('Should delete host by id (DELETE /hosts/:id)', async () => {
    // Arrange & Act
    const r = await deleteReq(app, testData.admin.token, `/hosts/${hostId}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (POST /company/:id/host)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await postReq(app, givenToken, `/company/${companyId}/host`, {
          hosts: [],
        });
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /hosts/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/hosts/${hostId}`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /hosts/:id/top-tcp-ports/:top)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(
          app,
          givenToken,
          `/hosts/${hostId}/top-tcp-ports/10`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /hosts/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(app, givenToken, `/hosts/${hostId}`);
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await deleteReq(app, testData.admin.token, `/company/${companyId}`);
    await app.close();
  });
});
