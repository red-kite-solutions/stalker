import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestingData, deleteReq, initTesting, postReq } from 'test/e2e.utils';
import { AppModule } from '../../../app.module';

describe('Event Subscriptions Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;
  let companyName = 'subscriptionCompany';
  let companyId: string;
  let subscriptionId: string;

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

    let r = await postReq(app, testData.user.token, '/company', {
      name: companyName,
    });
    companyId = r.body._id;
  });

  afterAll(async () => {
    await deleteReq(app, testData.user.token, `/company/${companyId}`);
    await app.close();
  });
});
