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

describe('Users Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const companyName = 'Stalker';
  let companyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
  });

  it('Should create a company (POST /company)', async () => {
    const r = await postReq(app, testData.user.token, '/company', {
      name: companyName,
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companyId = r.body._id;
  });

  it('Should get a company by id (GET /company/:id)', async () => {
    const r = await getReq(app, testData.user.token, `/company/${companyId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.name).toBe(companyName);
    expect(r.body._id).toBeTruthy();
  });

  it('Should delete a company (DELETE /company/:id)', async () => {
    const r = await deleteReq(
      app,
      testData.user.token,
      `/company/${companyId}`,
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should get the list of companies (GET /company)', async () => {
    let companies: string[] = [];
    let r = await postReq(app, testData.user.token, '/company', {
      name: companyName,
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companies.push(r.body._id);

    r = await postReq(app, testData.user.token, '/company', {
      name: 'StalkerTwo',
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companies.push(r.body._id);

    r = await getReq(app, testData.user.token, '/company');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThanOrEqual(2);

    for (let c of companies) {
      r = await deleteReq(app, testData.user.token, `/company/${c}`);
      expect(r.statusCode).toBe(HttpStatus.OK);
    }
  });

  it('Should have proper authorizations (GET /company)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/company`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /company)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/company`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /company/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /company/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /company/:id/host)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2/host`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /company/:id/domain)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2/domain`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /company/:id/job)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2/job`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
