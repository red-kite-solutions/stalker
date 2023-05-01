import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { cleanup, initTesting, TestingData } from 'test/e2e.utils';
import { AppModule } from '../../../app.module';
import { PortService } from './port.service';

describe('Port Controller (e2e)', () => {
  let app: INestApplication;
  let testData: TestingData;

  let moduleFixture: TestingModule;
  let portsService: PortService;
  const testPrefix = 'port-controller-e2e-';

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    portsService = await moduleFixture.resolve(PortService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    testData = await initTesting(app);
    await cleanup();
  });

  afterAll(async () => {
    await app.close();
  });

  function getName() {
    return `${testPrefix}-${randomUUID()}`;
  }
});
