import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  postReq,
  putReq,
} from '../../../test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';

describe('Project Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const projectNames = ['Stalker', 'StalkerTwo', 'StalkerThree', 'StalkerFour'];
  let projectId: string;
  const projects: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);

    // Pre-cleaning
    const r = await getReq(app, testData.user.token, '/project/summary');
    const currentProjects = r.body;
    for (let c of currentProjects) {
      if (projectNames.includes(c.name))
        await deleteReq(app, testData.user.token, `/project/${c._id}`);
    }
  });

  afterAll(async () => {
    for (let c of projects)
      await deleteReq(app, testData.user.token, `/project/${c}`);
    await app.close();
  });

  it('Should create a project (POST /project)', async () => {
    const r = await postReq(app, testData.user.token, '/project', {
      name: projectNames[0],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    projectId = r.body._id;
  });

  it('Should get a project by id (GET /project/:id)', async () => {
    const r = await getReq(app, testData.user.token, `/project/${projectId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.name).toBe(projectNames[0]);
    expect(r.body._id).toBeTruthy();
  });

  it('Should edit a project by id (PUT /project/:id)', async () => {
    const nameEdit = 'StalkerModified';
    const subnetEdit = ['192.168.0.1/24', '10.10.10.10/16', '121.1.1.1/30'];
    const notesEdit = 'great notes over here';
    let r = await putReq(app, testData.user.token, `/project/${projectId}`, {
      name: nameEdit,
      ipRanges: subnetEdit,
      notes: notesEdit,
    });
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.user.token, `/project/${projectId}`);
    expect(r.body._id).toBeTruthy();
    expect(r.body.name).toBe(nameEdit);
    expect(r.body.ipRanges).toEqual(subnetEdit);
    expect(r.body.notes).toBe(notesEdit);
  });

  it('Should edit a project by id, adding a logo (PUT /project/:id)', async () => {
    const logoB64 =
      'iVBORw0KGgoAAAANSUhEUgAAABQAAAA8CAYAAABmdppWAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAzSURBVFiF7cxBEQAgCAAwpBgZCGs+6eDx3ALsVN8Xi3IzEwqFQqFQKBQKhUKhUCgUCv8NhMECvInB4dQAAAAASUVORK5CYII=';
    let r = await putReq(app, testData.user.token, `/project/${projectId}`, {
      logo: logoB64,
      imageType: 'png',
    });
    r = await getReq(app, testData.user.token, `/project/${projectId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.logo).toBe(`data:image/png;base64,${logoB64}`);
  });

  it('Should edit a project by id, removing a logo (PUT /project/:id)', async () => {
    let r = await putReq(app, testData.user.token, `/project/${projectId}`, {
      logo: '',
    });
    r = await getReq(app, testData.user.token, `/project/${projectId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.logo).toBe('');
  });

  it('Should delete a project (DELETE /project/:id)', async () => {
    const r = await deleteReq(
      app,
      testData.user.token,
      `/project/${projectId}`,
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should get the list of projects (GET /project)', async () => {
    // Arrange
    let r = await postReq(app, testData.user.token, '/project', {
      name: projectNames[0],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    projects.push(r.body._id);

    r = await postReq(app, testData.user.token, '/project', {
      name: projectNames[1],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    projects.push(r.body._id);

    // Act
    r = await getReq(app, testData.user.token, '/project');

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThanOrEqual(2);
  });

  it('Should get the list of project summaries (GET /project/summary)', async () => {
    // Arrange
    let r = await postReq(app, testData.user.token, '/project', {
      name: projectNames[3],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    projects.push(r.body._id);

    r = await postReq(app, testData.user.token, '/project', {
      name: projectNames[2],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    projects.push(r.body._id);

    // Act
    r = await getReq(app, testData.user.token, '/project/summary');

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThanOrEqual(2);
  });

  it('Should have proper authorizations (GET /project)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/project`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /project/summary)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/project/summary`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /project)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/project`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /project/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/project/62780ca0156f3d3fda24c4e2`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PUT /project/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/project`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /project/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/project/62780ca0156f3d3fda24c4e2`,
        );
      },
    );
    expect(success).toBe(true);
  });
});
