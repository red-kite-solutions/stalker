import { Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { Model } from 'mongoose';
import { basename } from 'path';
import { parse } from 'yaml';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { validCustomJobTypeDetails } from '../jobs/models/custom-job.model';
import { CustomJobMetadata } from './custom-job-metadata.type';
import {
  CODE_JOB_FILES_PATH,
  NUCLEI_JOB_FILES_PATH,
} from './custom-jobs.constants';
import { CustomJobEntry } from './custom-jobs.model';

export class CustomJobsUtils {
  private static logger = new Logger(CustomJobsUtils.name);

  public static validateCustomJobPathInformation(
    path: string,
    fileName: string,
  ): boolean {
    const fileSplit = fileName.split('.');
    if (fileSplit.length <= 1) return false;

    const ext = fileSplit[fileSplit.length - 1].toLowerCase();
    if (ext !== 'yml' && ext !== 'yaml') return false;

    if (!existsSync(path + fileName)) return false;

    return true;
  }

  public static async getCustomJob(
    path: string,
    fileName: string,
    jobPodConfigModel: Model<JobPodConfiguration>,
  ): Promise<CustomJobEntry | null> {
    const baseName = basename(fileName);

    if (!CustomJobsUtils.validateCustomJobPathInformation(path, baseName)) {
      CustomJobsUtils.logger.debug(
        `invalid path to load a job: ${path + baseName}`,
      );
      return null;
    }

    let job: CustomJobEntry | null = null;
    try {
      const jobMetadata = <CustomJobMetadata>(
        parse(readFileSync(path + baseName).toString())
      );
      let codePath = '';
      let handlerPath = '';
      switch (jobMetadata.type) {
        case 'code':
          codePath = CODE_JOB_FILES_PATH + jobMetadata.codeFilePath;
          handlerPath = CODE_JOB_FILES_PATH + jobMetadata.handlerFilePath;
          break;
        case 'nuclei':
          codePath = NUCLEI_JOB_FILES_PATH + jobMetadata.codeFilePath;
          handlerPath = NUCLEI_JOB_FILES_PATH + jobMetadata.handlerFilePath;
          break;
        default:
          CustomJobsUtils.logger.debug(`Invalid type: ${jobMetadata.type}`);
          return null;
      }

      if (
        !validCustomJobTypeDetails.some(
          (c) =>
            c.type === jobMetadata.type &&
            c.language === jobMetadata.language &&
            c.handlerLanguage === jobMetadata.findingHandlerLanguage,
        )
      ) {
        CustomJobsUtils.logger.debug(
          'metadata type, language and handler language not matching',
        );
        return null;
      }

      if (!existsSync(codePath)) {
        CustomJobsUtils.logger.debug(`code path does not exist ${codePath}`);
        return null;
      }

      const jpc = await jobPodConfigModel.findOne({
        name: { $eq: jobMetadata.jobPodConfigName },
      });

      if (!jpc) {
        CustomJobsUtils.logger.debug(
          `Job pod config not found: ${jobMetadata.jobPodConfigName}`,
        );
        return null;
      }

      job = {
        name: jobMetadata.name,
        code: readFileSync(codePath).toString(),
        language: jobMetadata.language,
        type: jobMetadata.type,
        builtIn: true,
        builtInFilePath: baseName,
        parameters: jobMetadata.parameters,
        jobPodConfigId: jpc._id,
      };

      if (jobMetadata.handlerFilePath && existsSync(handlerPath)) {
        job.findingHandler = readFileSync(handlerPath).toString();
        job.findingHandlerEnabled = true;
        job.findingHandlerLanguage = jobMetadata.findingHandlerLanguage;
      }
    } catch (err) {
      CustomJobsUtils.logger.debug(err);
    }
    return job;
  }
}
