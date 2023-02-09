import { Logger } from '@nestjs/common';
import { JobParameterCountException } from '../../../exceptions/job-parameter.exception';
import { JobParameter } from '../subscriptions/subscriptions.model';
import { JobDefinitions } from './job-model.module';
import { Job } from './models/jobs.model';

export class JobFactory {
  private static logger = new Logger(JobFactory.name);

  public static createJob(jobName: string, args: JobParameter[]): Job {
    const jobDefinition = JobDefinitions.find((jd) => jd.name === jobName);

    if (!jobDefinition) {
      JobFactory.logger.warn(
        `Ignoring the call to [${jobName}]: no job definition matches the job name`,
      );
      return null;
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
}
