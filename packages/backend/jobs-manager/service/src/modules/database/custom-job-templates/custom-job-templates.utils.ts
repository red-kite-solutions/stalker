import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'path';
import { parse } from 'yaml';
import { JobPodConfiguration } from '../admin/config/job-pod-config/job-pod-config.model';
import { CustomJobMetadata } from '../custom-jobs/custom-job-metadata.type';
import {
  CODE_JOB_FILES_PATH,
  NUCLEI_JOB_FILES_PATH,
} from '../custom-jobs/custom-jobs.constants';
import { CustomJobsUtils } from '../custom-jobs/custom-jobs.utils';
import { validCustomJobTypeDetails } from '../jobs/models/custom-job.model';
import {
  CODE_JOB_TEMPLATE_FILES_PATH,
  NUCLEI_JOB_TEMPLATE_FILES_PATH,
} from './custom-job-templates.constants';
import { CustomJobTemplate } from './custom-job-templates.model';

export class CustomJobTemplateUtils {
  private static logger = new Logger(CustomJobTemplateUtils.name);

  public static async getCustomJob(
    path: string,
    fileName: string,
    templateSource: 'custom jobs' | 'templates',
    jobPodConfigModel: Model<JobPodConfiguration>,
  ): Promise<CustomJobTemplate | null> {
    const baseName = basename(fileName);

    if (!CustomJobsUtils.validateCustomJobPathInformation(path, baseName)) {
      CustomJobTemplateUtils.logger.debug(
        `invalid path to load a job: ${path + baseName}`,
      );
      return null;
    }

    let job: CustomJobTemplate | null = null;
    try {
      const jobMetadata = <CustomJobMetadata>(
        parse(readFileSync(path + baseName).toString())
      );
      let codePath = '';
      let handlerPath = '';
      let jobsDirectoryPath = '';

      switch (jobMetadata.type) {
        case 'code':
          jobsDirectoryPath =
            templateSource === 'custom jobs'
              ? CODE_JOB_FILES_PATH
              : CODE_JOB_TEMPLATE_FILES_PATH;
          codePath = jobsDirectoryPath + jobMetadata.codeFilePath;
          handlerPath = jobsDirectoryPath + jobMetadata.handlerFilePath;
          break;
        case 'nuclei':
          jobsDirectoryPath =
            templateSource === 'custom jobs'
              ? NUCLEI_JOB_FILES_PATH
              : NUCLEI_JOB_TEMPLATE_FILES_PATH;
          codePath = NUCLEI_JOB_FILES_PATH + jobMetadata.codeFilePath;
          handlerPath = NUCLEI_JOB_FILES_PATH + jobMetadata.handlerFilePath;
          break;
        default:
          CustomJobTemplateUtils.logger.debug(
            `Invalid type: ${jobMetadata.type}`,
          );
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
        CustomJobTemplateUtils.logger.debug(
          'metadata type, language and handler language not matching',
        );
        return null;
      }

      if (!existsSync(codePath)) {
        CustomJobTemplateUtils.logger.debug(
          `code path does not exist ${codePath}`,
        );
        return null;
      }

      const jpc = await jobPodConfigModel.findOne({
        name: { $eq: jobMetadata.jobPodConfigName },
      });

      if (!jpc) {
        CustomJobTemplateUtils.logger.debug(
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
        templateOrdering: jobMetadata.templateOrdering,
        jobPodConfigId: jpc._id,
      };

      if (jobMetadata.findingHandler && existsSync(handlerPath)) {
        job.findingHandler = readFileSync(handlerPath).toString();
        job.findingHandlerEnabled = true;
        job.findingHandlerLanguage = jobMetadata.findingHandlerLanguage;
      }
    } catch (err) {
      CustomJobTemplateUtils.logger.debug(err);
    }
    return job;
  }
}
