import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestingData, cleanup, initTesting } from '../../../test/e2e.utils';
import { AppModule } from '../../app.module';

describe('Alarm Controller (e2e)', () => {
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
    await app.close();
  });

  it('Should be true (VERB /alarm/)', async () => {
    // arrange & act
    // assert

    expect(true).toBe(true);
  });

  // ####################################
  // ########## Authorizations ##########
  // ####################################
});
