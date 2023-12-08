import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TestingData,
  checkAuthorizations,
  getReq,
  initTesting,
  postReq,
} from 'test/e2e.utils';
import { AppModule } from '../../../app.module';
import { Role } from '../../../auth/constants';

describe('Domain Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let comment: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testData = await initTesting(app);
    comment = Math.random().toString(36).substring(2, 12);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should add a comment to the current report (POST /report/comment)', async () => {
    const r = await postReq(app, testData.admin.token, '/report/comment', {
      comment: comment,
    });
    expect(r.statusCode).toBe(HttpStatus.CREATED);
  });

  it('Should get the current report (GET /report)', async () => {
    const r = await getReq(app, testData.admin.token, '/report');
    expect(r.statusCode).toBe(HttpStatus.OK);
    expect(r.body.comments.includes(comment)).toBe(true);
  });

  it('Should have proper authorizations (POST /report/comment)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.User,
      async (givenToken) => {
        return await postReq(app, givenToken, '/report/comment', {
          comment: comment,
        });
      },
    );
    expect(success).toBe(true);
  });

  it('Should have proper authorizations (GET /report)', async () => {
    const success = await checkAuthorizations(
      testData,
      Role.ReadOnly,
      async (givenToken) => {
        return await getReq(app, givenToken, '/report');
      },
    );
    expect(success).toBe(true);
  });
});
