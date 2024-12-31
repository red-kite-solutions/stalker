import { INestApplication, ValidationPipe } from '@nestjs/common';
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

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /job-containers)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/job-containers`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /job-containers/{id})', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/job-containers/65c387dee7ab9b4085a3f872`,
        );
      },
    );
    expect(success).toBe(true);
  });
});
