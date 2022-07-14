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

describe('Domain Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const companyName = 'StalkerDomain';
  let domain: string;
  let companyId: string;
  let domainId: string;

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
    let randomSub = Math.random().toString(36).substring(2, 12);
    randomSub += Math.random().toString(36).substring(2, 12);
    domain = randomSub + '.stalker.is';
  });

  it('Should create a domain (POST /company/:id/domain)', async () => {
    // expect(HttpStatus.CREATED).toBe(HttpStatus.CREATED);
    const r = await postReq(
      app,
      testData.admin.token,
      `/company/${companyId}/domain`,
      { domains: [domain] },
    );
    expect(r.statusCode).toBe(HttpStatus.CREATED);
  });

  it('Should get a paginated list of domains (GET /domains)', async () => {
    const r = await getReq(
      app,
      testData.admin.token,
      '/domains?page=0&pageSize=10',
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThanOrEqual(1);
    expect(r.body.length).toBeLessThanOrEqual(10);

    const domains: any[] = r.body;
    for (let d of domains) {
      if (d.name === domain) {
        domainId = d._id;
      }
    }
    expect(domainId).toBeTruthy();
  });

  it('Should get a filtered paginated list of domains (filter: domain) (GET /domains)', async () => {
    const filter = domain;
    const filterString = encodeURIComponent(filter);
    const r = await getReq(
      app,
      testData.admin.token,
      `/domains?page=0&pageSize=10&domain=${filterString}`,
    );
    console.log(filter);
    console.log(r.body);

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBe(1);

    const domains: any[] = r.body;
    for (let d of domains) {
      if (d.name === domain) {
        domainId = d._id;
      }
    }
    expect(domainId).toBeTruthy();
  });

  it('Should get the domain count (GET /domains/count)', async () => {
    const r = await getReq(app, testData.admin.token, `/domains/count`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.count).toBeGreaterThanOrEqual(1);
  });

  it('Should get the specific domain by id (GET /domains/:id)', async () => {
    const r = await getReq(app, testData.admin.token, `/domains/${domainId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.name).toBe(domain);
  });

  it('Should have proper authorizations (GET /domains)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, '/domains');
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /domains/count)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/domains/count`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /domains/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/domains/${companyId}`);
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await deleteReq(app, testData.admin.token, `/company/${companyId}`);
    await app.close();
  });
});
