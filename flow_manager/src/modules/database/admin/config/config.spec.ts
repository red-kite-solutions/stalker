import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { ConfigService } from './config.service';

describe('Config Service', () => {
  let moduleFixture: TestingModule;
  let configService: ConfigService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    configService = moduleFixture.get(ConfigService);
  });

  beforeEach(async () => {
    const jpcs = await configService.getAllJobPodConfigs();
    for (const jpc of jpcs) {
      await configService.deleteJobPodConfig(jpc._id.toString());
    }
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Create config', () => {
    it('Should create a job pod config', async () => {
      const jpcName = 'jpc1';
      const jpc = await jobPodConfig(jpcName);
      expect(jpc._id).toBeTruthy();
      expect(jpc.name).toStrictEqual(jpcName);
    });
  });

  describe('Delete configs', () => {
    it('Should get all the job pod configs', async () => {
      const jpc1 = await jobPodConfig('jpcdelete');
      const r = await configService.deleteJobPodConfig(jpc1._id.toString());
      expect(r.deletedCount).toStrictEqual(1);
    });
  });

  describe('Get configs', () => {
    it('Should get all the job pod configs', async () => {
      const jpc1 = await jobPodConfig('jpc1');
      const jpc2 = await jobPodConfig('jpc2');
      const jpc3 = await jobPodConfig('jpc3');

      const jpcs = await configService.getAllJobPodConfigs();

      expect(jpcs.length).toStrictEqual(3);
    });

    it('Should get job pod config by id', async () => {
      const jpc1 = await jobPodConfig('jpc1');
      const jpc = await configService.getJobPodConfig(jpc1._id.toString());
      expect(jpc._id.toString()).toStrictEqual(jpc1._id.toString());
    });
  });

  async function jobPodConfig(name: string) {
    return await configService.createJobPodConfig({
      name: name,
      memoryKbytesLimit: 10 * 1024,
      milliCpuLimit: 10,
    });
  }
});
