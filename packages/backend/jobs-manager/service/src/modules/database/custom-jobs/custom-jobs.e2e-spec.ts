import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  cleanup,
  deleteReq,
  getReq,
  initTesting,
  postReq,
  putReq,
} from '../../../test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';
import { JobPodConfigurationDocument } from '../admin/config/job-pod-config/job-pod-config.model';
import { JobDto } from './jobs.dto';

describe('Custom Jobs Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let customJobId: string;
  let jobPodConfigs: JobPodConfigurationDocument[];

  const customJob = {
    name: 'My custom job',
    type: 'code',
    code: 'print("custom job controller e2e")',
    language: 'python',
    jobPodConfigId: '',
  };

  const nucleiCustomJob: JobDto = {
    name: 'My nuclei custom job',
    type: 'nuclei',
    code: 'nuclei template placeholder',
    language: 'yaml',
    jobPodConfigId: '',
    findingHandler: undefined,
    findingHandlerLanguage: undefined,
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
    const res = await getReq(
      app,
      testData.admin.token,
      '/admin/config/job-pods',
    );
    jobPodConfigs = res.body;
    customJob.jobPodConfigId = jobPodConfigs[0]._id.toString();
    nucleiCustomJob.jobPodConfigId = jobPodConfigs[0]._id.toString();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
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

  it('Should create a custom job (handler enabled = false) (POST /custom-jobs)', async () => {
    // Arrange
    const cj: JobDto = {
      language: 'python',
      type: 'code',
      name: 'print secret',
      code: "import os\n\nprint(os.environ['secret'])",
      jobPodConfigId: '65b013faed7664d0b13d7e7c',
      findingHandlerEnabled: false,
    };

    // Act
    const r = await postReq(app, testData.user.token, '/custom-jobs', cj);

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
  });

  it('Should not create a custom job (handler enabled = true) (POST /custom-jobs)', async () => {
    // Arrange
    const cj: JobDto = {
      language: 'python',
      type: 'code',
      name: 'print secret',
      code: "import os\n\nprint(os.environ['secret'])",
      jobPodConfigId: '65b013faed7664d0b13d7e7c',
      findingHandlerEnabled: true,
    };

    // Act
    const r = await postReq(app, testData.user.token, '/custom-jobs', cj);

    expect(r.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('Should get the list of custom jobs (GET /custom-jobs)', async () => {
    // arrange & act
    const r = await getReq(app, testData.user.token, '/custom-jobs');
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBeTruthy();
  });

  it('Should edit a custom job (PUT /custom-jobs/{id})', async () => {
    // arrange
    const changedCode = 'print("this code is changed")';
    // act
    let r = await putReq(
      app,
      testData.user.token,
      `/custom-jobs/${customJobId}`,
      {
        ...customJob,
        code: changedCode,
      },
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.user.token, '/custom-jobs');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toBeTruthy();
  });

  it('Should not edit a custom job (name duplicate) (PUT /custom-jobs/{id})', async () => {
    // arrange
    const changedName = 'name duplicate';
    await postReq(app, testData.user.token, '/custom-jobs', {
      ...customJob,
      name: changedName,
    });

    // act
    let r = await putReq(
      app,
      testData.user.token,
      `/custom-jobs/${customJobId}`,
      {
        ...customJob,
        name: changedName,
      },
    );
    // assert
    expect(r.statusCode).toBe(HttpStatus.CONFLICT);
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

  it('Should create a nuclei custom job (POST /custom-jobs)', async () => {
    // arrange & act
    const r = await postReq(
      app,
      testData.user.token,
      '/custom-jobs',
      nucleiCustomJob,
    );

    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    expect(r.body.type).toStrictEqual(nucleiCustomJob.type);
    customJobId = r.body._id;
  });

  it('Should create a nuclei custom job with custom handler (POST /custom-jobs)', async () => {
    // arrange
    const nucleiDto: JobDto = {
      ...nucleiCustomJob,
      name: 'Nuclei custom handler',
      findingHandler: 'handler content placeholder',
      findingHandlerLanguage: 'python',
    };

    // act
    const r = await postReq(
      app,
      testData.user.token,
      '/custom-jobs',
      nucleiDto,
    );

    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    expect(r.body.findingHandler).toStrictEqual(nucleiDto.findingHandler);
    expect(r.body.findingHandlerLanguage).toStrictEqual(
      nucleiDto.findingHandlerLanguage,
    );
  });

  it('Should not create a nuclei custom job (name duplicate) (POST /custom-jobs)', async () => {
    // arrange
    const nucleiDto: JobDto = {
      ...nucleiCustomJob,
      name: 'Nuclei custom handler',
      findingHandler: 'handler content placeholder',
      findingHandlerLanguage: 'python',
    };

    // act
    const r = await postReq(
      app,
      testData.user.token,
      '/custom-jobs',
      nucleiDto,
    );

    // assert
    expect(r.statusCode).toBe(HttpStatus.CONFLICT);
  });

  it('Should not create a nuclei custom job (wrong language) (POST /custom-jobs)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/custom-jobs', {
      ...nucleiCustomJob,
      language: 'python',
    });

    // assert
    expect(r.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('Should not create a nuclei custom job (wrong handler language) (POST /custom-jobs)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/custom-jobs', {
      ...nucleiCustomJob,
      findingHandler: 'handler content placeholder',
      findingHandlerLanguage: 'yaml',
    });

    // assert
    expect(r.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('Should not create a nuclei custom job (missing handler language) (POST /custom-jobs)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/custom-jobs', {
      ...nucleiCustomJob,
      findingHandler: 'handler content placeholder',
    });

    // assert
    expect(r.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('Should not create a nuclei custom job (missing handler) (POST /custom-jobs)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/custom-jobs', {
      ...nucleiCustomJob,
      findingHandlerLanguage: 'yaml',
    });

    // assert
    expect(r.statusCode).toBe(HttpStatus.BAD_REQUEST);
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

  it('Should have proper authorizations (GET /custom-jobs/id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/custom-jobs/65c387dee7ab9b4085a3f872`,
        );
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

  it('Should have proper authorizations (PUT /custom-jobs/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await putReq(app, givenToken, `/custom-jobs/${customJobId}`, {});
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

  it('Should have proper authorizations (POST /custom-jobs/sync)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.Admin,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/custom-jobs/sync`);
      },
    );
    expect(success).toBe(true);
  });
});
