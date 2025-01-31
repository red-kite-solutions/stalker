import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import {
  TestingData,
  checkAuthorizations,
  cleanup,
  createDomain as createDomains,
  createHosts,
  createProject,
  createTag,
  deleteReq,
  getReq,
  initTesting,
  patchReq,
  postReq,
  putReq,
} from '../../../../test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';
import { HostService } from './host.service';

describe('Host Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;

  let moduleFixture: TestingModule;
  let hostsService: HostService;
  const testPrefix = 'host-controller-e2e-';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostsService = await moduleFixture.resolve(HostService);

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

  function getName() {
    return `${testPrefix}-${randomUUID()}`;
  }

  describe('GET /host', () => {
    it('List hosts - Not authorized - Should return 401', async () => {
      const success = await checkAuthorizations(
        testData,
        Role.ReadOnly,
        async (givenToken) => {
          return await getReq(app, givenToken, `/hosts`);
        },
      );
      expect(success).toBe(true);
    });

    it('List hosts - Different page sizes - Should return expected hosts', async () => {
      // Arrange
      const project1 = await createProject(app, testData, getName());
      const project2 = await createProject(app, testData, getName());

      const domain1 = 'www.example.org';
      const domain2 = 'www.example.com';
      await createDomains(app, testData, project1._id, [domain1]);
      await createDomains(app, testData, project2._id, [domain2]);

      await hostsService.addHostsWithDomain(
        ['192.168.1.1', '192.168.1.2'],
        domain1,
        project1._id,
        [],
      );
      await hostsService.addHostsWithDomain(
        ['192.168.1.3', '192.168.1.4', '192.168.1.5', '192.168.1.6'],
        domain2,
        project2._id,
        [],
      );

      // Act & Assert
      const allDataResult = await getReq(
        app,
        testData.user.token,
        '/hosts?page=0&pageSize=10',
      );

      expect(allDataResult.statusCode).toBe(200);
      expect(allDataResult.body.totalRecords).toBe(6);
      expect(allDataResult.body.items.length).toBe(6);

      // Act & Assert
      const subsetResult = await getReq(
        app,
        testData.user.token,
        '/hosts?page=0&pageSize=4',
      );

      expect(subsetResult.body.totalRecords).toBe(6);
      expect(subsetResult.body.items.length).toBe(4);

      // Act & Assert
      const secondPage = await getReq(
        app,
        testData.user.token,
        '/hosts?page=1&pageSize=4',
      );

      expect(secondPage.body.totalRecords).toBe(6);
      expect(secondPage.body.items.length).toBe(2);
    });

    it('List hosts - Filter by project - Should return only hosts matching the filter', async () => {
      // Arrange
      const project1 = await createProject(app, testData, getName());
      const project2 = await createProject(app, testData, getName());

      const domain1 = 'www.example.org';
      const domain2 = 'www.example.com';
      await createDomains(app, testData, project1._id, [domain1]);
      await createDomains(app, testData, project2._id, [domain2]);

      // Act
      await hostsService.addHostsWithDomain(
        ['192.168.2.1', '192.168.2.2'],
        domain1,
        project1._id,
        [],
      );
      await hostsService.addHostsWithDomain(
        ['192.168.2.2', '192.168.2.4', '192.168.2.5', '192.168.2.6'],
        domain2,
        project2._id,
        [],
      );

      // Act & Assert test
      const filtered = await getReq(
        app,
        testData.user.token,
        `/hosts?page=0&pageSize=2&projects[]=${project2._id}`,
      );

      expect(filtered.body.totalRecords).toBe(4);
      expect(filtered.body.items.length).toBe(2);
    });
  });

  describe('GET /hosts/:id/ports/:portNumber', () => {
    it('Get host port - Not authorized - Should return 401', async () => {
      const success = await checkAuthorizations(
        testData,
        Role.ReadOnly,
        async (givenToken) => {
          return await getReq(
            app,
            givenToken,
            `/hosts/507f1f77bcf86cd799439011/ports/80`,
          );
        },
      );
      expect(success).toBe(true);
    });
  });

  it('Should create a host (POST /hosts)', async () => {
    // Arrange
    const project = await createProject(app, testData, getName());
    const domain = 'www.example.org';
    await createDomains(app, testData, project._id, [domain]);

    // Act
    const r = await postReq(app, testData.admin.token, `/hosts`, {
      ips: ['192.168.2.1', '192.168.2.2'],
      projectId: project._id.toString(),
    });

    // Assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body[0]._id).toBeTruthy();
  });

  it('Should get a host by id (GET /hosts/:id)', async () => {
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
    const r = await getReq(app, testData.admin.token, `/hosts/${hostId}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body._id).toBeTruthy();
    expect(r.body._id).toStrictEqual(hostId);
  });

  it('Should tag a host (PUT /hosts/:id/tags)', async () => {
    // Arrange
    const project = await createProject(app, testData, getName());
    const tag = await createTag(app, testData, 'my-tag-1');
    const hosts = await createHosts(app, testData, project._id, [
      '192.168.1.1',
    ]);

    // Act
    const r = await putReq(
      app,
      testData.admin.token,
      `/hosts/${hosts[0]._id}/tags`,
      { tagId: tag._id, isTagged: true },
    );

    // Assert
    const r2 = await getReq(
      app,
      testData.admin.token,
      `/hosts/${hosts[0]._id}`,
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r2.body.tags[0]).toStrictEqual(tag._id);
  });

  it('Should untag a host (PUT /hosts/:id/tags)', async () => {
    // Arrange
    const project = await createProject(app, testData, getName());
    const tag = await createTag(app, testData, 'my-tag-1');
    const hosts = await createHosts(app, testData, project._id, [
      '192.168.1.1',
    ]);
    let r = await putReq(
      app,
      testData.admin.token,
      `/hosts/${hosts[0]._id}/tags`,
      { tagId: tag._id, isTagged: true },
    );

    // Act
    r = await putReq(app, testData.admin.token, `/hosts/${hosts[0]._id}/tags`, {
      tagId: tag._id,
      isTagged: false,
    });

    // Assert
    const r2 = await getReq(
      app,
      testData.admin.token,
      `/hosts/${hosts[0]._id}`,
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r2.body.tags.length).toStrictEqual(0);
  });

  it('Should delete host by id (DELETE /hosts/:id)', async () => {
    // Arrange
    const project = await createProject(app, testData, getName());
    const domain = 'www.example.org';
    await createDomains(app, testData, project._id, [domain]);
    const rHost = await postReq(app, testData.admin.token, `/hosts`, {
      ips: ['192.168.2.1'],
      projectId: project._id.toString(),
    });

    const hostId = rHost.body[0]._id;

    // Arrange
    const r = await deleteReq(app, testData.admin.token, `/hosts/${hostId}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (PUT /hosts/:id/tags)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await putReq(
          app,
          givenToken,
          `/hosts/6450827d0ae00198f250672d/tags`,
          {
            hosts: [],
            isTagged: true,
          },
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /hosts)', async () => {
    // Arrange
    const project = await createProject(app, testData, getName());

    // Assert
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await postReq(app, givenToken, `/hosts`, {
          hosts: [],
        });
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /hosts/:id)', async () => {
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
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/hosts/${hostId}`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /hosts/:id)', async () => {
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
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(app, givenToken, `/hosts/${hostId}`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /hosts/)', async () => {
    // Arrange & Act
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(app, givenToken, `/hosts/`, []);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PATCH /hosts/)', async () => {
    // Arrange & Act
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await patchReq(app, givenToken, `/hosts/`, {});
      },
    );
    expect(success).toBe(true);
  });
});
