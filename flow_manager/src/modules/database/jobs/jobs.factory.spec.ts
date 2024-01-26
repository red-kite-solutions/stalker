import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { DEFAULT_JOB_POD_FALLBACK_CONFIG } from '../admin/config/config.default';
import { ConfigService } from '../admin/config/config.service';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { ProjectService } from '../reporting/project.service';
import { Secret } from '../secrets/secrets.model';
import { SecretsService } from '../secrets/secrets.service';
import { JobParameter } from '../subscriptions/event-subscriptions/event-subscriptions.model';
import { JobFactoryUtils } from './jobs.factory';
import { JobsService } from './jobs.service';
import { Job } from './models/jobs.model';

describe('Jobs Service', () => {
  let moduleFixture: TestingModule;
  let jobsModel: Model<Job>;
  let jobsService: JobsService;
  let projectService: ProjectService;
  let configService: ConfigService;
  let jobPodConfigModel: Model<JobPodConfiguration>;
  let secretsService: SecretsService;
  let secretsModel: Model<Secret>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    jobsService = moduleFixture.get(JobsService);
    projectService = moduleFixture.get(ProjectService);
    configService = moduleFixture.get(ConfigService);
    secretsService = moduleFixture.get(SecretsService);
    jobsModel = moduleFixture.get<Model<Job>>(getModelToken('job'));
    jobPodConfigModel = moduleFixture.get<Model<JobPodConfiguration>>(
      getModelToken('jobPodConfig'),
    );
    secretsModel = moduleFixture.get<Model<Secret>>(getModelToken('secret'));
  });

  beforeEach(async () => {
    const allProjects = await projectService.getAll();
    for (const c of allProjects) {
      await projectService.delete(c._id);
    }
    await jobPodConfigModel.deleteMany({});
    const allSecrets = await secretsService.getAll();
    for (const secret of allSecrets) {
      await secretsService.delete(secret._id.toString());
    }
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

  it('Should replace a single secret tag value for its secret', async () => {
    // Arrange
    const secretName = 'secretName';
    const secretValue = 'example secret value';
    const secretNameTag = `\$\{\{${secretName}\}\}`;
    const s = await secretsService.create(secretName, secretValue);

    // Act
    // @ts-expect-error
    const valueToReplace = await JobFactoryUtils.getSecretIfInjectTag(
      secretNameTag,
      secretsService,
    );

    // Assert
    const svalue = (await secretsModel.findById(s._id, '+value')).value;
    expect(valueToReplace).toStrictEqual(svalue);
  });

  it('Should inject a secret in a parameter array', async () => {
    // Arrange
    const secretName = 'secretName';
    const secretValue = 'example secret value';
    const secretNameTag = `\$\{\{${secretName}\}\}`;
    const params: JobParameter[] = [
      {
        name: 'asdf',
        value: 'example',
      },
      {
        name: 'asdf2',
        value: '${varNameDidNotMatch}',
      },
      {
        name: 'asdf3',
        value: secretNameTag,
      },
    ];
    const s = await secretsService.create(secretName, secretValue);

    // Act
    await JobFactoryUtils.injectSecretsInParameters(params, secretsService);

    // Assert
    const svalue = (await secretsModel.findById(s._id, '+value')).value;
    expect(params[2].value).toStrictEqual(svalue);
  });

  it('Should inject a secret in a parameter array, with one parameter being an array', async () => {
    // Arrange
    const secretName = 'secretName';
    const secretValue = 'example secret value';
    const secretNameTag: string = `\$\{\{${secretName}\}\}`;
    const params: JobParameter[] = [
      {
        name: 'asdf',
        value: 'example',
      },
      {
        name: 'asdf2',
        value: '${varNameDidNotMatch}',
      },
      {
        name: 'asdf3',
        value: ['asdf', secretNameTag, 'example'],
      },
    ];
    const s = await secretsService.create(secretName, secretValue);

    // Act
    await JobFactoryUtils.injectSecretsInParameters(params, secretsService);

    // Assert
    const svalue = (await secretsModel.findById(s._id, '+value')).value;
    expect(params[2].value[1]).toStrictEqual(svalue);
  });

  async function jobPodConfig() {
    return await jobPodConfigModel.create({
      name: 'test config',
      memoryKbytesLimit: 10 * 1024,
      milliCpuLimit: 100,
    });
  }
});
