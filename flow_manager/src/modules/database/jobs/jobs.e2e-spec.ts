import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app.module';
import { Role } from 'src/modules/auth/constants';
import request from 'supertest';
import {
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  postReq,
  TestingData,
} from 'test/e2e.utils';

describe('Config Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let jobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
  });

  it('Should fail to create a new job since the id is not valid (POST /jobs/create)', async () => {
    const r = await postReq(app, testData.user.token, '/jobs/create', {
      task: 'DomainNameResolvingJob',
      companyId: 'ThisIsNotAValidId',
      priority: 1,
      domainName: 'stalker.is',
    });
    expect(r.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('Should fail to create a new job since the company does not exist (POST /jobs/create)', async () => {
    const r = await postReq(app, testData.user.token, '/jobs/create', {
      task: 'DomainNameResolvingJob',
      companyId: '6271641f2c0920007820b5f2',
      priority: 1,
      domainName: 'stalker.is',
    });
    expect(r.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should get an empty job list (GET /jobs)', async () => {
    const r = await getReq(app, testData.readonly.token, '/jobs');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBe(0);
  });

  it('Should create a domain name resolving job', async () => {
    const task = 'DomainNameResolvingJob';
    const domain = 'stalker.is';
    let r = await postReq(app, testData.user.token, '/report/company', {
      name: 'Stalker',
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);

    expect(r.body._id).toBeTruthy();

    const companyId = r.body._id;

    r = await postReq(app, testData.user.token, '/jobs/create', {
      task: task,
      companyId: companyId,
      priority: 1,
      domainName: domain,
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body.id).toBeTruthy();

    jobId = r.body.id;
    r = await getReq(app, testData.user.token, '/jobs');

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBe(jobId);
    expect(r.body[0].task).toBe(task);
    expect(r.body[0].domainName).toBe(domain);
    expect(r.body[0].priority).toBe(1);

    r = await deleteReq(
      app,
      testData.admin.token,
      `/report/company/${companyId}`,
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should delete a job (DELETE /jobs/:id)', async () => {
    const r = await deleteReq(app, testData.user.token, `/jobs/${jobId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should delete all jobs in the database (DELETE /jobs)', async () => {
    const task = 'DomainNameResolvingJob';
    const domain = 'stalker.is';
    let r = await postReq(app, testData.user.token, '/report/company', {
      name: 'Stalker',
    });

    const companyId = r.body._id;

    await postReq(app, testData.user.token, '/jobs/create', {
      task: task,
      companyId: companyId,
      priority: 1,
      domainName: domain,
    });
    await postReq(app, testData.user.token, '/jobs/create', {
      task: task,
      companyId: companyId,
      priority: 1,
      domainName: domain,
    });

    r = await getReq(app, testData.readonly.token, '/jobs');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBe(2);

    r = await deleteReq(app, testData.user.token, '/jobs');
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.readonly.token, '/jobs');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBe(0);

    await deleteReq(app, testData.user.token, `/report/company/${companyId}`);
  });

  it('Should have proper authorizations (GET /jobs)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, '/jobs');
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /jobs/create)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, '/jobs/create', {
          task: 'DomainNameResolvingJob',
          companyId: '6271641f2c0920007820b5f2',
          priority: 1,
          domainName: 'stalker.is',
        });
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /jobs/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/jobs/6271641f2c0920007820b5f2`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /jobs)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(app, givenToken, `/jobs`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /jobs/byworker/:id)', async () => {
    const r = await request(app.getHttpServer())
      .delete('/jobs')
      .set('API_KEY', `ThisIsNotAValidKey`);

    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  afterAll(async () => {
    await app.close();
  });
});
