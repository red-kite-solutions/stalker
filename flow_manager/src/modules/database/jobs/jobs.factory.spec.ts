import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { DEFAULT_JOB_POD_FALLBACK_CONFIG } from '../admin/config/config.default';
import { ConfigService } from '../admin/config/config.service';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { CompanyService } from '../reporting/company.service';
import { JobFactoryUtils } from './jobs.factory';
import { JobsService } from './jobs.service';
import { Job } from './models/jobs.model';

describe('Jobs Service', () => {
  let moduleFixture: TestingModule;
  let jobsModel: Model<Job>;
  let jobsService: JobsService;
  let companyService: CompanyService;
  let configService: ConfigService;
  let jobPodConfigModel: Model<JobPodConfiguration>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    jobsService = moduleFixture.get(JobsService);
    companyService = moduleFixture.get(CompanyService);
    configService = moduleFixture.get(ConfigService);
    jobsModel = moduleFixture.get<Model<Job>>(getModelToken('job'));
    jobPodConfigModel = moduleFixture.get<Model<JobPodConfiguration>>(
      getModelToken('jobPodConfig'),
    );
  });

  beforeEach(async () => {
    const allCompanies = await companyService.getAll();
    for (const c of allCompanies) {
      await companyService.delete(c._id);
    }
    await jobPodConfigModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('Should get an existing config', async () => {
    // Arrange
    const jpc = await jobPodConfig();

    // Act
    const found = await JobFactoryUtils.getCustomJobPodConfig(
      { jobPodConfigId: jpc._id },
      configService,
    );

    // Assert
    expect(found.memoryKbytesLimit).toStrictEqual(jpc.memoryKbytesLimit);
    expect(found.milliCpuLimit).toStrictEqual(jpc.milliCpuLimit);
    expect(found.name).toStrictEqual(jpc.name);
  });

  it('Should get a non-existing config, and therefore get the default config in return', async () => {
    // Arrange
    const jpc = await jobPodConfig();
    await jobPodConfigModel.deleteOne(jpc._id);
    const defaultConfig = DEFAULT_JOB_POD_FALLBACK_CONFIG;

    // Act
    const found = await JobFactoryUtils.getCustomJobPodConfig(
      { jobPodConfigId: jpc._id },
      configService,
    );

    // Assert
    expect(found.memoryKbytesLimit).toStrictEqual(
      defaultConfig.memoryKbytesLimit,
    );
    expect(found.milliCpuLimit).toStrictEqual(defaultConfig.milliCpuLimit);
    expect(found.name).toStrictEqual(defaultConfig.name);
  });

  it('Should get the default config by providing a null id', async () => {
    // Arrange
    const defaultConfig = DEFAULT_JOB_POD_FALLBACK_CONFIG;

    // Act
    const found = await JobFactoryUtils.getCustomJobPodConfig(
      { jobPodConfigId: null },
      configService,
    );

    // Assert
    expect(found.memoryKbytesLimit).toStrictEqual(
      defaultConfig.memoryKbytesLimit,
    );
    expect(found.milliCpuLimit).toStrictEqual(defaultConfig.milliCpuLimit);
    expect(found.name).toStrictEqual(defaultConfig.name);
  });

  async function jobPodConfig() {
    return await jobPodConfigModel.create({
      name: 'test config',
      memoryKbytesLimit: 10 * 1024,
      milliCpuLimit: 100,
    });
  }
});
