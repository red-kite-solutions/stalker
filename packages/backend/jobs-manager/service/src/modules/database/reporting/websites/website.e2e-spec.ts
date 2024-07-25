import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import {
  TestingData,
  checkAuthorizations,
  cleanup,
  deleteReq,
  getReq,
  initTesting,
  patchReq,
  putReq,
} from '../../../../test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';
import { WebsiteService } from './website.service';

describe('Website Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;

  let moduleFixture: TestingModule;
  let portsService: WebsiteService;
  const testPrefix = 'website-controller-e2e-';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    portsService = await moduleFixture.resolve(WebsiteService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    testData = await initTesting(app);
    await cleanup();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should have proper authorizations (PUT /websites/:id/tags)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await putReq(
          app,
          givenToken,
          `/websites/6450827d0ae00198f250672d/tags`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /websites)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/websites/`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /websites/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(
          app,
          givenToken,
          `/websites/6450827d0ae00198f250672d`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /websites/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(
          app,
          givenToken,
          `/websites/6450827d0ae00198f250672d`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /websites/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(app, givenToken, `/websites/`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PATCH /websites/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await patchReq(app, givenToken, `/websites/`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PATCH /websites/merge)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await patchReq(app, givenToken, `/websites/`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PATCH /websites/unmerge)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await patchReq(app, givenToken, `/websites/`, {});
      },
    );
    expect(success).toBe(true);
  });

  function getName() {
    return `${testPrefix}-${randomUUID()}`;
  }
});
