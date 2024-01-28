import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { JobParameterCountException } from '../../../exceptions/job-parameter.exception';
import { ProjectUnassigned } from '../../../validators/is-project-id.validator';
import { DEFAULT_JOB_POD_FALLBACK_CONFIG } from '../admin/config/config.default';
import { ConfigService } from '../admin/config/config.service';
import {
  JobPodConfiguration,
  JobPodConfigurationDocument,
} from '../admin/config/job-pod-config/job-pod-config.model';
import {
  CustomJobEntry,
  CustomJobsDocument,
} from '../custom-jobs/custom-jobs.model';
import { SecretsService } from '../secrets/secrets.service';
import { JobParameter } from '../subscriptions/event-subscriptions/event-subscriptions.model';
import { JobDefinitions } from './job-model.module';
import { CustomJob } from './models/custom-job.model';
import { Job } from './models/jobs.model';

const customJobParameters = 'customJobParameters';

export class JobFactory {
  private static logger = new Logger(JobFactory.name);

  public static async createJob(
    jobName: string,
    args: JobParameter[],
    secretsService: SecretsService,
    projectId: string = undefined,
    jobPodConfig: JobPodConfiguration = null,
  ): Promise<Job> {
    const jobDefinition = JobDefinitions.find((jd) => jd.name === jobName);

    if (!jobDefinition) {
      JobFactory.logger.warn(
        `Ignoring the call to [${jobName}]: no job definition matches the job name`,
      );
      return null;
    }

    if (
      jobPodConfig &&
      jobPodConfig.milliCpuLimit &&
      jobPodConfig.memoryKbytesLimit
    ) {
      args = JobFactoryUtils.setupJobPodConfigParameters(args, jobPodConfig);
    }

    if (jobName === CustomJob.name) {
      await JobFactoryUtils.injectSecretsInParameters(
        <JobParameter[]>args.find((v) => v.name === customJobParameters).value,
        secretsService,
        projectId,
      );
    } else {
      await JobFactoryUtils.injectSecretsInParameters(
        args,
        secretsService,
        projectId,
      );
    }

    console.log(args);

    try {
      return jobDefinition.create(args);
    } catch (err) {
      JobFactory.logger.warn(`Ignoring the call to [${jobName}]: ${err}`);
      return null;
    }
  }
}

export class JobFactoryUtils {
  private static logger = new Logger(JobFactoryUtils.name);
  public static bindFunctionArguments(
    params: { [key: string]: unknown },
    args: JobParameter[],
    optionalKeys: string[] = [],
  ) {
    for (const arg of args) {
      params[arg.name.toLowerCase()] = arg.value;
    }

    for (const key of Object.keys(params)) {
      if (params[key] === undefined && !optionalKeys.some((v) => v === key)) {
        throw new JobParameterCountException(
          `The ${key} parameter was not filled by the provided arguments. (A parameter is likely missing)`,
        );
      }
    }

    return params;
  }

  /**
   * Finds and returns the proper job pod configuration according to the given customJob. If none are found, the default one is returned.
   * @param customJob The custom job containing a jobPodConfigId
   * @param configService The config service from which to get the job pod configurations
   * @returns The JobPodConfiguration identified by the jobPodConfigId if found, the default fallback config otherwise
   */
  public static async getCustomJobPodConfig(
    customJob: CustomJobEntry | { jobPodConfigId: Types.ObjectId },
    configService: ConfigService,
  ) {
    if (!customJob.jobPodConfigId) {
      JobFactoryUtils.logger.debug(
        'No job pod configuration id given, using the fallback config',
      );
      return JobFactoryUtils.getDefaultConfig();
    }

    let jpConfig: JobPodConfigurationDocument;
    try {
      jpConfig = await configService.getJobPodConfig(
        customJob.jobPodConfigId.toString(),
      );

      if (!jpConfig) {
        JobFactoryUtils.logger.debug(
          `Did not find job pod configuration id ${customJob.jobPodConfigId}, using the fallback config`,
        );
        return JobFactoryUtils.getDefaultConfig();
      }
    } catch (err) {
      JobFactoryUtils.logger.debug(
        `Error while getting the job pod configuration id ${customJob.jobPodConfigId}`,
      );
      JobFactoryUtils.logger.debug(err);
      return JobFactoryUtils.getDefaultConfig();
    }

    return jpConfig;
  }

  private static getDefaultConfig() {
    return <JobPodConfiguration>(
      JSON.parse(JSON.stringify(DEFAULT_JOB_POD_FALLBACK_CONFIG))
    );
  }

  public static setupCustomJobParameters(
    customJob: CustomJobEntry | CustomJobsDocument,
    currentParameters: JobParameter[],
  ): JobParameter[] {
    const customJobParams = JSON.parse(JSON.stringify(currentParameters));
    const jobParameters = [];
    jobParameters.push({ name: 'name', value: customJob.name });
    jobParameters.push({ name: 'code', value: customJob.code });
    jobParameters.push({ name: 'type', value: customJob.type });
    jobParameters.push({
      name: 'language',
      value: customJob.language,
    });
    jobParameters.push({
      name: customJobParameters,
      value: customJobParams,
    });
    if (customJob.findingHandlerEnabled) {
      jobParameters.push({
        name: 'findinghandlerenabled',
        value: customJob.findingHandlerEnabled,
      });
    }
    if (customJob.findingHandler) {
      jobParameters.push({
        name: 'findinghandler',
        value: customJob.findingHandler,
      });
    }
    if (customJob.findingHandlerLanguage) {
      jobParameters.push({
        name: 'findinghandlerlanguage',
        value: customJob.findingHandlerLanguage,
      });
    }

    return jobParameters;
  }

  public static setupJobPodConfigParameters(
    currentParameters: JobParameter[],
    jobPodConfig: JobPodConfiguration,
  ): JobParameter[] {
    const jobParameters = [].concat(currentParameters);
    jobParameters.push({
      name: 'jobpodmillicpulimit',
      value: jobPodConfig.milliCpuLimit,
    });
    jobParameters.push({
      name: 'jobpodmemorykblimit',
      value: jobPodConfig.memoryKbytesLimit,
    });
    return jobParameters;
  }

  public static async injectSecretsInParameters(
    jobParameters: JobParameter[],
    secretsService: SecretsService,
    projectId: string = undefined,
  ) {
    for (const param of jobParameters) {
      if (Array.isArray(param.value)) {
        for (let i = 0; i < param.value.length; ++i) {
          if (typeof param.value[i] !== 'string') continue;
          param.value[i] = await JobFactoryUtils.getSecretIfInjectTag(
            param.value[i],
            secretsService,
            projectId,
          );
        }
        continue;
      }

      if (typeof param.value !== 'string') continue;
      param.value = await JobFactoryUtils.getSecretIfInjectTag(
        param.value,
        secretsService,
        projectId,
      );
    }
  }

  private static async getSecretIfInjectTag(
    value: string,
    secretsService: SecretsService,
    projectId: string = undefined,
  ) {
    // https://regex101.com/r/wUp5Tn/1
    const expressionRegex = /^\s*\$\{\s*secrets\.([^\s\{\}]+)\s*\}\s*$/i;
    const match = value.match(expressionRegex);

    if (!match || match.length <= 1) return value;

    // Would extract domainName from ${{ domainName }}
    const secretName = match[1];
    const secret = await secretsService.getBestSecretWithValue(
      secretName,
      projectId === ProjectUnassigned ? undefined : projectId,
    );

    if (!secret) return value;

    return secret.value;
  }
}
