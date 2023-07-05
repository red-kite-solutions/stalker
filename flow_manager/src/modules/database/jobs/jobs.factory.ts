import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { JobParameterCountException } from '../../../exceptions/job-parameter.exception';
import { DEFAULT_JOB_POD_FALLBACK_CONFIG } from '../admin/config/config.default';
import { ConfigService } from '../admin/config/config.service';
import {
  JobPodConfiguration,
  JobPodConfigurationDocument,
} from '../admin/config/job-pod-config/job-pod-config.model';
import { CustomJobEntry } from '../custom-jobs/custom-jobs.model';
import { JobParameter } from '../subscriptions/subscriptions.model';
import { JobDefinitions } from './job-model.module';
import { Job } from './models/jobs.model';

export class JobFactory {
  private static logger = new Logger(JobFactory.name);

  public static createJob(
    jobName: string,
    args: JobParameter[],
    jobPodConfig: JobPodConfiguration = null,
  ): Job {
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
      args.push({
        name: 'jobpodmillicpulimit',
        value: jobPodConfig.milliCpuLimit,
      });
      args.push({
        name: 'jobpodmemorykblimit',
        value: jobPodConfig.memoryKbytesLimit,
      });
    }

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
  ) {
    for (const arg of args) {
      params[arg.name.toLowerCase()] = arg.value;
    }

    for (const key of Object.keys(params)) {
      if (params[key] === undefined) {
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
}
