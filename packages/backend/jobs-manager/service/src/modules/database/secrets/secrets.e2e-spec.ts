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
} from '../../../test/e2e.utils';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';
import { CreateSecretDto } from './secrets.dto';

describe('Secrets Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;

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

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  const secret: CreateSecretDto = {
    name: 'FirstSecret',
    value: 'Secret value',
    projectId: ProjectUnassigned,
    description: 'example description',
  };

  it('Should create a secret (POST /secrets/)', async () => {
    // arrange & act
    const r = await postReq(app, testData.user.token, '/secrets/', secret);
    // assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    expect(r.body.value).toBeUndefined();
  });

  it('Should get all the secrets (GET /secrets/)', async () => {
    // arrange
    let r = await postReq(app, testData.user.token, '/secrets/', secret);
    const id = r.body._id;
    const name = r.body.name;

    // act
    r = await getReq(app, testData.user.token, '/secrets/');

    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body[0]._id).toStrictEqual(id);
    expect(r.body[0].name).toStrictEqual(name);
    expect(r.body[0].value).toBeUndefined();
  });

  it('Should get a secret (GET /secrets/:id)', async () => {
    // arrange
    let r = await postReq(app, testData.user.token, '/secrets/', secret);
    const id = r.body._id;
    const name = r.body.name;

    // act
    r = await getReq(app, testData.user.token, `/secrets/${id}`);

    // assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body._id).toStrictEqual(id);
    expect(r.body.name).toStrictEqual(name);
    expect(r.body.value).toBeUndefined();
  });

  it('Should delete a secret (DELETE /secrets/:id)', async () => {
    // arrange
    let r = await postReq(app, testData.user.token, '/secrets/', secret);
    const id = r.body._id;
    const name = r.body.name;

    // act
    r = await deleteReq(app, testData.user.token, `/secrets/${id}`);

    // assert
    r = await getReq(app, testData.user.token, `/secrets/${id}`);
    expect(r.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################

  it('Should have proper authorizations (GET /secrets)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(app, givenToken, `/secrets`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /secrets/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken: string) => {
        return await getReq(
          app,
          givenToken,
          `/secrets/507f1f77bcf86cd799439011`,
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /secrets/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await postReq(app, givenToken, `/secrets/`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /secrets/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken: string) => {
        return await deleteReq(
          app,
          givenToken,
          `/secrets/507f1f77bcf86cd799439011`,
        );
      },
    );
    expect(success).toBe(true);
  });
});
