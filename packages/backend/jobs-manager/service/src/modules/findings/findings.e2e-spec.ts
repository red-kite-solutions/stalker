import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  checkAuthorizationsCronApiKey,
  getReq,
  initTesting,
  postReq,
} from '../../test/e2e.utils';
import { AppModule } from '../app.module';
import { Role } from '../auth/constants';

describe('Findings Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let jobId: string;

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
    await app.close();
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /findings/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/findings/`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /findings/cleanup)', async () => {
    const success = await checkAuthorizationsCronApiKey(
      testData,
      async (givenToken: string, headers, authenticate) => {
        return await postReq(
          app,
          givenToken,
          `/findings/cleanup`,
          undefined,
          headers,
          authenticate,
        );
      },
    );
    expect(success).toBe(true);
  });
});
