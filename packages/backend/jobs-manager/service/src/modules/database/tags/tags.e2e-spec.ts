import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  deleteReq,
  getReq,
  initTesting,
  postReq,
} from '../../../test/e2e.utils';
import { AppModule } from '../../app.module';
import { Role } from '../../auth/constants';

describe('Tags Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let tagId: string;
  let tag = { text: 'My Tag', color: '#c0ffee' };

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

  it('Should create a tag (POST /tags/)', async () => {
    // Arrange & Act
    const r = await postReq(app, testData.user.token, `/tags/`, tag);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.CREATED);
    expect(r.body._id).toBeTruthy();
    tagId = r.body._id;
  });

  it('Should get a tag by id (GET /tags/:id)', async () => {
    // Arrange & Act
    const r = await getReq(app, testData.user.token, `/tags/${tagId}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body._id).toBe(tagId);
    expect(r.body.text).toBe(tag.text);
    expect(r.body.color).toBe(tag.color);
  });

  it('Should get all tags (GET /tags/)', async () => {
    // Arrange & Act
    const r = await getReq(app, testData.user.token, `/tags/`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.length).toBeGreaterThanOrEqual(1);
  });

  it('Should delete a tag by id (DELETE /tags/:id)', async () => {
    // Arrange & Act
    const r = await deleteReq(app, testData.user.token, `/tags/${tagId}`);

    // Assert
    expect(r.statusCode).toBe(HttpStatus.OK);
  });

  it('Should have proper authorizations (GET /tags/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/tags/`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /tags/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, `/tags/${tagId}`);
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (POST /tags/)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await postReq(app, givenToken, `/tags/`, {});
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (DELETE /tags/:id)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await deleteReq(app, givenToken, `/tags/${tagId}`);
      },
    );
    expect(success).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
