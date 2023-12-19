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
} from 'test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';

describe('Company Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const companyNames = ['Stalker', 'StalkerTwo', 'StalkerThree', 'StalkerFour'];
  let companyId: string;
  const companies: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);

    // Pre-cleaning
    const r = await getReq(app, testData.user.token, '/company/summary');
    const currentCompanies = r.body;
    for (let c of currentCompanies) {
      if (companyNames.includes(c.name))
        await deleteReq(app, testData.user.token, `/company/${c._id}`);
    }
  });

  afterAll(async () => {
    for (let c of companies)
      await deleteReq(app, testData.user.token, `/company/${c}`);
    await app.close();
  });

  it('Should create a company (POST /company)', async () => {
    const r = await postReq(app, testData.user.token, '/company', {
      name: companyNames[0],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companyId = r.body._id;
  });

  it('Should get a company by id (GET /company/:id)', async () => {
    const r = await getReq(app, testData.user.token, `/company/${companyId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.name).toBe(companyNames[0]);
    expect(r.body._id).toBeTruthy();
  });

  it('Should edit a company by id (PUT /company/:id)', async () => {
    const nameEdit = 'StalkerModified';
    const subnetEdit = ['192.168.0.1/24', '10.10.10.10/16', '121.1.1.1/30'];
    const notesEdit = 'great notes over here';
    let r = await putReq(app, testData.user.token, `/company/${companyId}`, {
      name: nameEdit,
      ipRanges: subnetEdit,
      notes: notesEdit,
    });
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.user.token, `/company/${companyId}`);
    expect(r.body._id).toBeTruthy();
    expect(r.body.name).toBe(nameEdit);
    expect(r.body.ipRanges).toEqual(subnetEdit);
    expect(r.body.notes).toBe(notesEdit);
  });

  it('Should edit a company by id, adding a logo (PUT /company/:id)', async () => {
    const logoB64 =
      'iVBORw0KGgoAAAANSUhEUgAAABQAAAA8CAYAAABmdppWAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAzSURBVFiF7cxBEQAgCAAwpBgZCGs+6eDx3ALsVN8Xi3IzEwqFQqFQKBQKhUKhUCgUCv8NhMECvInB4dQAAAAASUVORK5CYII=';
    let r = await putReq(app, testData.user.token, `/company/${companyId}`, {
      logo: logoB64,
      imageType: 'png',
    });
    r = await getReq(app, testData.user.token, `/company/${companyId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.logo).toBe(`data:image/png;base64,${logoB64}`);
  });

  it('Should edit a company by id, removing a logo (PUT /company/:id)', async () => {
    let r = await putReq(app, testData.user.token, `/company/${companyId}`, {
      logo: '',
    });
    r = await getReq(app, testData.user.token, `/company/${companyId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.logo).toBe('');
  });

  it('Should delete a company (DELETE /company/:id)', async () => {
    const r = await deleteReq(
      app,
      testData.user.token,
      `/company/${companyId}`,
    );
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should get the list of companies (GET /company)', async () => {
    // Arrange
    let r = await postReq(app, testData.user.token, '/company', {
      name: companyNames[0],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companies.push(r.body._id);

    r = await postReq(app, testData.user.token, '/company', {
      name: companyNames[1],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companies.push(r.body._id);

    // Act
    r = await getReq(app, testData.user.token, '/company');

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThanOrEqual(2);
  });

  it('Should get the list of company summaries (GET /company/summary)', async () => {
    // Arrange
    let r = await postReq(app, testData.user.token, '/company', {
      name: companyNames[3],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companies.push(r.body._id);

    r = await postReq(app, testData.user.token, '/company', {
      name: companyNames[2],
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    companies.push(r.body._id);

    // Act
    r = await getReq(app, testData.user.token, '/company/summary');

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThanOrEqual(2);
  });

  it('Should have proper authorizations (GET /company)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/company`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /company/summary)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/company/summary`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /company)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/company`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /company/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PUT /company/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/company`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /company/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /company/:id/host)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2/host`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /company/:id/domain)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(
          app,
          givenToken,
          `/company/62780ca0156f3d3fda24c4e2/domain`,
          {},
        );
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
          `/company/62780ca0156f3d3fda24c4e2/job`,
          {},
        );
      },
    );
    expect(success).toBe(true);
  });
});
