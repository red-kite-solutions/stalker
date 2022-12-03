import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { initTesting, TestingData } from 'test/e2e.utils';
import { AppModule } from '../../app.module';

describe('Subscriptions Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;

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
});
