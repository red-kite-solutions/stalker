import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestingData, cleanup, initTesting } from '../../../test/e2e.utils';
import { AppModule } from '../../app.module';

describe('Alarm Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;

  beforeAll(async () => {
    console.log('Alarm controller -- Before module fixture');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    console.log('Alarm controller -- After module fixture');

    app = moduleFixture.createNestApplication();

    console.log('Alarm controller -- After create nest application');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    console.log('Alarm controller -- After use global pipes');
    await app.init();
    console.log('Alarm controller -- After app init');
    testData = await initTesting(app);
    console.log('Alarm controller -- After init testing for test data');
  });

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
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
