import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  cleanup,
  getReq,
  initTesting,
} from '../../../test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';

describe('Custom Job Templates Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let customJobId: string;

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

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('Should get all custom job template (GET /custom-job-templates)', async () => {
    // Arrange && Act
    const r = await getReq(app, testData.user.token, '/custom-job-templates');

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body[0].code).toBeDefined();
  });

  it('Should get all custom job template summaries (GET /custom-job-templates/summary)', async () => {
    // Arrange && Act
    const r = await getReq(
      app,
      testData.user.token,
      '/custom-job-templates/summary',
    );

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body[0].code).not.toBeDefined();
  });

  it('Should get a custom job template by id (GET /custom-job-templates/{id})', async () => {
    // Arrange
    let r = await getReq(
      app,
      testData.user.token,
      '/custom-job-templates/summary',
    );
    const id = r.body[0]._id;

    // Act
    r = await getReq(app, testData.user.token, `/custom-job-templates/${id}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body._id).toStrictEqual(id);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /custom-job-templates)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/custom-job-templates`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /custom-job-templates/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/custom-job-templates/65c387dee7ab9b4085a3f872`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /custom-job-templates/summary)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/custom-job-templates/summary`);
      },
    );
    expect(success).toBe(true);
  });
});
