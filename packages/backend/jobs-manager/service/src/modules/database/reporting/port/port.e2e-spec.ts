import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import {
  TestingData,
  checkAuthorizations,
  cleanup,
  createDomain as createDomains,
  createProject,
  deleteReq,
  getReq,
  initTesting,
  patchReq,
  postReq,
  putReq,
} from '../../../../test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';
import { PortService } from './port.service';

describe('Port Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;

  let moduleFixture: TestingModule;
  let portsService: PortService;
  const testPrefix = 'port-controller-e2e-';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    portsService = await moduleFixture.resolve(PortService);

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

  describe("GET a host's ports /ports", () => {
    it('Should get the TCP ports of a host without ports (GET /ports/)', async () => {
      // Arrange
      const project = await createProject(app, testData, getName());
      const domain = 'www.example.org';
      await createDomains(app, testData, project._id, [domain]);
      const rHost = await postReq(app, testData.admin.token, `/hosts`, {
        ips: ['192.168.2.1'],
        projectId: project._id.toString(),
      });

      const hostId = rHost.body[0]._id;

      // Act
      const r = await getReq(
        app,
        testData.admin.token,
        `/ports/?hostId=${hostId}&page=0&pageSize=10&protocol=tcp`,
      );

      // Assert
      expect(r.statusCode).toBe(HttpStatus.OK);
      expect(r.body.items.length).toStrictEqual(0);
      expect(r.body.totalRecords).toStrictEqual(0);
    });
  });

  it('Should have proper authorizations (GET /ports/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/ports/6450827d0ae00198f250672d`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PUT /ports/:id/tags)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await putReq(
          app,
          givenToken,
          `/ports/6450827d0ae00198f250672d/tags`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /ports)', async () => {
    // Arrange
    const project = await createProject(app, testData, getName());
    const domain = 'www.example.org';
    await createDomains(app, testData, project._id, [domain]);
    const rHost = await postReq(app, testData.admin.token, `/hosts`, {
      ips: ['192.168.2.1'],
      projectId: project._id.toString(),
    });

    const hostId = rHost.body[0]._id;

    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/ports?`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /ports/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(
          app,
          givenToken,
          `/ports/6450827d0ae00198f250672d`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /ports/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(app, givenToken, `/ports/`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PATCH /ports/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await patchReq(app, givenToken, `/ports/`, {});
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });

  function getName() {
    return `${testPrefix}-${randomUUID()}`;
  }
});
