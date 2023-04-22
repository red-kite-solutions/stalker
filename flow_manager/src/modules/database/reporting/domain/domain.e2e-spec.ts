import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  postReq,
  putReq,
  TestingData,
} from 'test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';

describe('Domain Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const companyName = 'StalkerDomain';
  let domain: string;
  let companyId: string;
  let domainId: string;
  let tagId: string;

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

  afterAll(async () => {
    await app.close();
  });

  it('Should create a domain (POST /company/:id/domain)', async () => {
    // Arrange & Act
    const r = await postReq(
      app,
      testData.admin.token,
      `/company/${companyId}/domain`,
      { domains: [domain] },
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
  });

  it('Should create multiple domains (POST /company/:id/domain)', async () => {
    // Arrange
    const domains = [
      'first.domain.addedasbatch.stalker.is',
      'second.domain.addedasbatch.stalker.is',
    ];

    // Act
    const r = await postReq(
      app,
      testData.admin.token,
      `/company/${companyId}/domain`,
      { domains: domains },
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
  });

  it('Should get a paginated list of domains (GET /domains)', async () => {
    // Arrange & Act
    const r = await getReq(
      app,
      testData.admin.token,
      '/domains?page=0&pageSize=10',
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.items.length).toBeGreaterThanOrEqual(3);
    expect(r.body.totalRecords).toBeGreaterThanOrEqual(3);
    expect(r.body.items.length).toBeLessThanOrEqual(10);
    expect(r.body.totalRecords).toBeLessThanOrEqual(10);

    const domains: any[] = r.body.items;
    for (let d of domains) {
      if (d.name === domain) {
        domainId = d._id;
      }
    }
    expect(domainId).toBeTruthy();
  });

  it('Should get a paginated list of domains with empty filters (GET /domains)', async () => {
    // Arrange & Act
    const r = await getReq(
      app,
      testData.admin.token,
      '/domains?page=0&pageSize=10tags[]=&domain[]=&company=',
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.items.length).toBeGreaterThanOrEqual(3);
    expect(r.body.totalRecords).toBeGreaterThanOrEqual(3);
    expect(r.body.items.length).toBeLessThanOrEqual(10);
    expect(r.body.totalRecords).toBeLessThanOrEqual(10);
  });

  it('Should edit the specific domain by id (PUT /domains/:id)', async () => {
    // Arrange
    let r = await postReq(app, testData.admin.token, `/tags/`, {
      color: '#beef12',
      text: 'Beef',
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    tagId = r.body._id;
    let tags = [tagId];

    // Act
    r = await putReq(app, testData.admin.token, `/domains/${domainId}`, {
      tags: tags,
    });

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    r = await getReq(app, testData.admin.token, `/domains/${domainId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.name).toBe(domain);
    expect(r.body.tags).toEqual(tags);
  });

  it('Should get a filtered paginated list of domains (filter: domain) (GET /domains)', async () => {
    // Arrange
    const filter = domain;
    const filterString = encodeURIComponent(filter);

    // Act
    const r = await getReq(
      app,
      testData.admin.token,
      `/domains?page=0&pageSize=10&domain[]=${filterString}`,
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.items.length).toBe(1);
    expect(r.body.totalRecords).toBe(1);

    const domains: any[] = r.body.items;
    for (let d of domains) {
      if (d.name === domain) {
        domainId = d._id;
      }
    }
    expect(domainId).toBeTruthy();
  });

  it('Should get a filtered paginated list of domains (filter: company) (GET /domains)', async () => {
    // Arrange & Act
    const r = await getReq(
      app,
      testData.admin.token,
      `/domains?page=0&pageSize=10&company=${companyId}`,
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.items.length).toBe(3);
    expect(r.body.totalRecords).toBe(3);

    const domains: any[] = r.body.items;
    for (let d of domains) {
      if (d.name === domain) {
        domainId = d._id;
      }
    }
    expect(domainId).toBeTruthy();
  });

  it('Should get a filtered paginated list of domains (filter: tags) (GET /domains)', async () => {
    // Arrange & Act
    const r = await getReq(
      app,
      testData.admin.token,
      `/domains?page=0&pageSize=10&tags[]=${tagId}`,
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.items.length).toBe(1);
    expect(r.body.totalRecords).toBe(1);

    const domains: any[] = r.body.items;
    for (let d of domains) {
      if (d.name === domain) {
        domainId = d._id;
      }
    }
    expect(domainId).toBeTruthy();
  });

  it('Should get the specific domain by id (GET /domains/:id)', async () => {
    // Arrange & Act
    const r = await getReq(app, testData.admin.token, `/domains/${domainId}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.name).toBe(domain);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

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

  it('Should have proper authorizations (PUT /domains/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await putReq(app, givenToken, `/domains/${companyId}`, {});
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await deleteReq(app, testData.admin.token, `/company/${companyId}`);
    await deleteReq(app, testData.admin.token, `/tags/${tagId}`);
    await app.close();
  });
});
