import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
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

describe('Job Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let jobId: string;
  const domainNameResolvingJob = {
    task: 'DomainNameResolvingJob',
    priority: 1,
    domainName: 'stalker.is',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
  });

  it('Should fail to create a new job since the company does not exist (POST /company/:id/job)', async () => {
    const r = await postReq(
      app,
      testData.user.token,
      '/company/6271641f2c0920007820b5f2/job',
      domainNameResolvingJob,
    );
    expect(r.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should get a job list (GET /jobs)', async () => {
    const r = await getReq(app, testData.readonly.token, '/jobs');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).not.toBe(undefined);
  });

  it('Should create a domain name resolving job (POST /company/:id/job)', async () => {
    let r = await postReq(app, testData.user.token, '/company', {
      name: 'StalkerJobs' + randomUUID(),
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);

    expect(r.body._id).toBeTruthy();

    const companyId = r.body._id;
    r = await postReq(
      app,
      testData.user.token,
      `/company/${companyId}/job`,
      domainNameResolvingJob,
    );

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body.id).toBeTruthy();

    jobId = r.body.id;
  });

  it('Should get a job by id (GET /jobs/:id)', async () => {
    const r = await getReq(app, testData.user.token, `/jobs/${jobId}`);

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body._id).toBe(jobId);
    expect(r.body.task).toBe(domainNameResolvingJob.task);
    expect(r.body.domainName).toBe(domainNameResolvingJob.domainName);
    expect(r.body.priority).toBe(1);
  });

  it('Should delete a job (DELETE /jobs/:id)', async () => {
    const r = await deleteReq(app, testData.user.token, `/jobs/${jobId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
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

  it('Should have proper authorizations (GET /jobs/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, '/jobs/6271641f2c0920007820b5f2');
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
          '/company/6271641f2c0920007820b5f2/job',
          domainNameResolvingJob,
        );
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

  it('Should have proper authorizations (DELETE /jobs/byworker/:id)', async () => {
    const r = await request(app.getHttpServer())
      .delete('/jobs/byworker/6271641f2c0920007820b5f2')
      .set('API_KEY', `ThisIsNotAValidKey`);

    expect(r.statusCode).toBe(HttpStatus.UNAUTHORIZED);
  });

  // The delete all jobs path cannot be called using this method
  // because it breaks the tests because they are run in parallel

  afterAll(async () => {
    await app.close();
  });
});
