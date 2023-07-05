import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  checkAuthorizations,
  createCompany,
  deleteReq,
  getReq,
  initTesting,
  postReq,
  TestingData,
} from 'test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';

fdescribe('Job Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let jobId: string;
  const domainNameResolvingJob = {
    task: 'DomainNameResolvingJob',
    jobParameters: [{ name: 'domainName', value: 'stalker.is' }],
    source: 'Stalker',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
  });

  afterAll(async () => {
    await app.close();
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

  it('Should create a domain name resolving job (POST /company/:id/job)', async () => {
    // Arrange
    const c = await createCompany(app, testData);

    // Act
    const r = await postReq(
      app,
      testData.user.token,
      `/company/${c._id}/job`,
      domainNameResolvingJob,
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body.id).toBeTruthy();

    jobId = r.body.id;
  });

  fit('Should get a job list (GET /jobs)', async () => {
    // Arrange
    const c = await createCompany(app, testData);

    const jr = await postReq(
      app,
      testData.user.token,
      `/company/${c._id}/job`,
      domainNameResolvingJob,
    );

    // Act
    const r = await getReq(app, testData.readonly.token, '/jobs');

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.items.length).not.toBe(undefined);
    expect(r.body.totalRecords).not.toBe(undefined);
  });

  it('Should get a job by id (GET /jobs/:id)', async () => {
    const r = await getReq(app, testData.user.token, `/jobs/${jobId}`);

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body._id).toBe(jobId);
    expect(r.body.task).toBe(domainNameResolvingJob.task);
    expect(r.body.domainName).toBe(
      domainNameResolvingJob.jobParameters[0].value,
    );
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

  // The delete all jobs path cannot be called using this method
  // because it breaks the tests as they are run in parallel
});
