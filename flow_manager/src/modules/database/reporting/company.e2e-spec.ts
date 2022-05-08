import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/modules/app.module';
import { initTesting, TestingData } from 'test/e2e.utils';

describe('Users Controller (e2e)', () => {
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

  it('EMPTY', async () => {
    expect(true).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
