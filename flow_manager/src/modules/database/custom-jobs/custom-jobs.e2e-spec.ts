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

describe('Custom Jobs Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let customJobId: string;

  const customJob = {
    name: 'My custom job',
    type: 'code',
    code: 'print("custom job controller e2e")',
    language: 'python',
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
  });

  it('Should create a custom job (POST /custom-jobs)', async () => {
    // arrange & act
    const r = await postReq(
      app,
      testData.user.token,
      '/custom-jobs',
      customJob,
    );

    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    customJobId = r.body._id;
  });

  it('Should get the list of custom jobs (GET /custom-jobs)', async () => {
    // arrange & act
    const r = await getReq(app, testData.user.token, '/custom-jobs');
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBe(customJobId);
    expect(r.body[0].name).toBe(customJob.name);
  });

  it('Should edit a custom job (POST /custom-jobs/{id})', async () => {
    // arrange
    const changedCode = 'print("this code is changed")';
    // act
    let r = await postReq(
      app,
      testData.user.token,
      `/custom-jobs/${customJobId}`,
      {
        ...customJob,
        code: changedCode,
      },
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);

    r = await getReq(app, testData.user.token, '/custom-jobs');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBe(customJobId);
    expect(r.body[0].code).toBe(changedCode);
  });

  it('Should delete a custom job by id (DELETE /custom-jobs/{id})', async () => {
    // arrange & act
    const r = await deleteReq(
      app,
      testData.user.token,
      `/custom-jobs/${customJobId}`,
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /custom-jobs)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/custom-jobs`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /custom-jobs)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/custom-jobs`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /custom-jobs/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/custom-jobs/${customJobId}`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /custom-jobs)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(app, givenToken, `/custom-jobs/${customJobId}`);
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
