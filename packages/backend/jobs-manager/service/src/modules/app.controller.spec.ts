import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let moduleFixture: TestingModule;
  let appController: AppController;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = moduleFixture.get<AppController>(AppController);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('root', () => {
    it('Should return a version string', () => {
      expect(appController.getVersion()).toBe('a version string');
    });
  });
});
