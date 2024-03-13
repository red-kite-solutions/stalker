import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  login,
  postReq,
  putReq,
} from '../../../test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';

describe('Users Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  const newUser = {
    email: 'newuser@stalker.is',
    firstName: 'New',
    lastName: 'User',
    password: 'thisishispassword',
    active: false,
    role: 'read-only',
  };

  const newUserEdited = {
    email: 'newuseredited@stalker.is',
    firstName: 'Newedited',
    lastName: 'Useredited',
    active: true,
    role: 'user',
    password: 'thisishisnewpassword',
  };

  let newUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should get the users (GET /users)', async () => {
    const r = await getReq(app, testData.admin.token, '/users');
    expect(r.body.length).toBeGreaterThanOrEqual(3);
    expect(r.body[0]._id).toBe(testData.admin.id);
    expect(r.body[0].email).toBe(testData.admin.email);
    expect(r.body[0].firstName).toBe(testData.admin.firstName);
    expect(r.body[0].lastName).toBe(testData.admin.lastName);
    expect(r.body[0].password).toBeFalsy();
  });

  it('Should not create a user (wrong password) (POST /users)', async () => {
    let r = await postReq(app, testData.admin.token, '/users', {
      currentPassword: 'wrongpass',
      ...newUser,
    });

    expect(r.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('Should not create a user (email conflict) (POST /users)', async () => {
    let r = await postReq(app, testData.admin.token, '/users', {
      currentPassword: testData.admin.password,
      ...newUser,
      email: testData.readonly.email,
    });

    expect(r.statusCode).toBe(HttpStatus.CONFLICT);
  });

  it('Should create a user (POST /users)', async () => {
    let r = await postReq(app, testData.admin.token, '/users', {
      currentPassword: testData.admin.password,
      ...newUser,
    });

    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    expect(r.body.password).toBe('********');
    newUserId = r.body._id;
  });

  it('Should get a specific user by ID (GET /users/:id)', async () => {
    const r = await getReq(app, testData.admin.token, `/users/${newUserId}`);

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.firstName).toBe(newUser.firstName);
    expect(r.body.lastName).toBe(newUser.lastName);
    expect(r.body.email).toBe(newUser.email);
    expect(r.body.role).toBe(newUser.role);
    expect(r.body.password).toBeFalsy();
    expect(r.body.active).toBe(newUser.active);
  });

  it('Should not edit a user by id (wrong password) (PUT /users/:id)', async () => {
    let r = await putReq(app, testData.admin.token, `/users/${newUserId}`, {
      currentPassword: 'wrongpass',
      ...newUserEdited,
    });
    expect(r.statusCode).toBe(HttpStatus.FORBIDDEN);

    r = await getReq(app, testData.admin.token, `/users/${newUserId}`);

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.firstName).toBe(newUser.firstName);
    expect(r.body.lastName).toBe(newUser.lastName);
    expect(r.body.email).toBe(newUser.email);
    expect(r.body.role).toBe(newUser.role);
    expect(r.body.password).toBeFalsy();
    expect(r.body.active).toBe(newUser.active);
  });

  it('Should not edit a user by id (email conflict) (PUT /users/:id)', async () => {
    let r = await putReq(app, testData.admin.token, `/users/${newUserId}`, {
      currentPassword: testData.admin.password,
      ...newUserEdited,
      email: testData.readonly.email,
    });
    expect(r.statusCode).toBe(HttpStatus.CONFLICT);

    r = await getReq(app, testData.admin.token, `/users/${newUserId}`);

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.firstName).toBe(newUser.firstName);
    expect(r.body.lastName).toBe(newUser.lastName);
    expect(r.body.email).toBe(newUser.email);
    expect(r.body.role).toBe(newUser.role);
    expect(r.body.password).toBeFalsy();
    expect(r.body.active).toBe(newUser.active);
  });

  it('Should edit a user by id (PUT /users/:id)', async () => {
    let r = await putReq(app, testData.admin.token, `/users/${newUserId}`, {
      currentPassword: testData.admin.password,
      ...newUserEdited,
    });
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.admin.token, `/users/${newUserId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.firstName).toBe(newUserEdited.firstName);
    expect(r.body.lastName).toBe(newUserEdited.lastName);
    expect(r.body.email).toBe(newUserEdited.email);
    expect(r.body.role).toBe(newUserEdited.role);
    expect(r.body.password).toBeFalsy();
    expect(r.body.active).toBe(newUserEdited.active);
  });

  it("Should not change a user's password by id (wrong password) (PUT /users/:id/password)", async () => {
    const r = await putReq(
      app,
      testData.admin.token,
      `/users/${newUserId}/password`,
      {
        newPassword: newUserEdited.password,
        currentPassword: 'wrongpass',
      },
    );
    expect(r.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it("Should change a user's password by id (PUT /users/:id/password)", async () => {
    let r = await putReq(
      app,
      testData.admin.token,
      `/users/${newUserId}/password`,
      {
        newPassword: newUserEdited.password,
        currentPassword: testData.admin.password,
      },
    );
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await login(app, newUserEdited.email, newUserEdited.password);
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body.access_token).toBeTruthy();
  });

  it("Should not let a user edit someone's info (user is not admin) (PUT /users/:id)", async () => {
    const r = await putReq(
      app,
      testData.user.token,
      `/users/${testData.readonly.id}`,
      {
        currentPassword: testData.user.password,
        ...newUserEdited,
      },
    );

    expect(r.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('Should let a user partially edit their info (PUT /users/:id)', async () => {
    const sId = (await login(app, newUserEdited.email, newUserEdited.password))
      .body.access_token;
    let r = await putReq(app, sId, `/users/${newUserId}`, {
      currentPassword: newUserEdited.password,
      ...newUser,
    });

    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, sId, `/users/${newUserId}`);

    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.firstName).toBe(newUser.firstName);
    expect(r.body.lastName).toBe(newUser.lastName);
    expect(r.body.email).toBe(newUserEdited.email);
    expect(r.body.role).toBe(newUserEdited.role);
    expect(r.body.password).toBeFalsy();
    expect(r.body.active).toBe(newUserEdited.active);
  });

  it("Should not change another user's password by id (user is not admin) (PUT /users/:id/password)", async () => {
    const sId = (await login(app, newUserEdited.email, newUserEdited.password))
      .body.access_token;
    const r = await putReq(
      app,
      sId,
      `/users/${testData.readonly.id}/password`,
      {
        newPassword: newUser.password,
        currentPassword: newUserEdited.password,
      },
    );
    expect(r.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('Should let a user change their own password (PUT /users/:id/password)', async () => {
    const sId = (await login(app, newUserEdited.email, newUserEdited.password))
      .body.access_token;
    let r = await putReq(app, sId, `/users/${newUserId}/password`, {
      newPassword: newUser.password,
      currentPassword: newUserEdited.password,
    });
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await login(app, newUserEdited.email, newUser.password);
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body.access_token).toBeTruthy();
  });

  it('Should delete a user by id (DELETE /users/:id)', async () => {
    let r = await deleteReq(app, testData.admin.token, `/users/${newUserId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);

    r = await getReq(app, testData.admin.token, `/users/${newUserId}`);
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body).toEqual({});
  });

  it("Should not let a user request someone's info (user is not admin) (GET /users/:id)", async () => {
    const r = await getReq(
      app,
      testData.user.token,
      `/users/${testData.readonly.id}`,
    );

    expect(r.statusCode).toBe(HttpStatus.FORBIDDEN);
  });

  it('Should let a user request their info (GET /users/:id)', async () => {
    const r = await getReq(
      app,
      testData.user.token,
      `/users/${testData.user.id}`,
    );

    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  // auth test on every route

  it('Should have proper authorizations (GET /users)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.Admin,
      async (givenToken) => {
        return await getReq(app, givenToken, '/users');
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /users)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.Admin,
      async (givenToken, passwd) => {
        return await postReq(app, givenToken, '/users', {
          currentPassword: passwd,
          ...newUser,
          email: testData.readonly.email,
        });
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /users/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, '/users/62770a061e3b39d52095867a');
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PUT /users/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken, passwd) => {
        return await putReq(
          app,
          givenToken,
          '/users/62770a061e3b39d52095867a',
          {
            currentPassword: passwd,
            ...newUser,
          },
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (PUT /users/:id/password)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken, passwd) => {
        return await putReq(
          app,
          givenToken,
          '/users/62770a061e3b39d52095867a/password',
          {
            currentPassword: passwd,
            newPassword: passwd,
          },
        );
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /users/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.Admin,
      async (givenToken) => {
        return await deleteReq(
          app,
          givenToken,
          '/users/62770a061e3b39d52095867a',
        );
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
