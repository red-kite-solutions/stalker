import { Logger } from '@nestjs/common';
import * as realFs from 'fs';
import { FsPromisesApi as MemfsFsPromisesApi } from 'memfs/lib/node/types';
import path from 'path';
import { parse } from 'yaml';
import { JobPodConfigurationDocument } from '../admin/config/job-pod-config/job-pod-config.model';
import { validCustomJobTypeDetails } from '../jobs/models/custom-job.model';
import { CustomJobMetadataV2 } from './custom-job-metadata.type';
import { CustomJobEntry } from './custom-jobs.model';

type FsPromisesApi = MemfsFsPromisesApi | typeof realFs.promises;

async function exists(fs: FsPromisesApi, path: string) {
  try {
    await fs.access(path);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export class JobReader {
  private logger = new Logger(JobReader.name);

  public async validatePath(
    path: string,
    fileName: string,
    fs?: FsPromisesApi,
  ): Promise<boolean> {
    fs ??= realFs.promises;

    const fileSplit = fileName.split('.');
    if (fileSplit.length <= 1) return false;

    const ext = fileSplit[fileSplit.length - 1].toLowerCase();
    if (ext !== 'yml' && ext !== 'yaml') return false;

    if (!(await exists(fs, path + fileName))) return false;

    return true;
  }

  /** Reads a job configuration using the given file system. */
  public async readJob(
    jobsPath: string,
    jobName: string,
    podConfigurations: JobPodConfigurationDocument[],
    fs?: FsPromisesApi,
  ): Promise<CustomJobEntry | null> {
    fs ??= realFs.promises;

    const jobPath = path.join(jobsPath, jobName);
    const templatePath = path.join(jobPath, 'template.yaml');

    if (!(await exists(fs, templatePath))) {
      this.logger.debug(`invalid path to load a job: ${templatePath}`);
      return null;
    }

    let job: CustomJobEntry | null = null;
    try {
      const jobMetadata = <CustomJobMetadataV2>(
        parse((await fs.readFile(templatePath)).toString())
      );

      let codePath = '';
      let handlerPath = '';
      switch (jobMetadata.type) {
        case 'code':
          codePath = path.join(jobPath, 'main.py');
          break;
        case 'nuclei':
          codePath = path.join(jobPath, 'nuclei.yaml');
          handlerPath = path.join(jobPath, 'handler.py');
          break;
        default:
          this.logger.debug(`Invalid type: ${jobMetadata.type}`);
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
        this.logger.debug(
          'metadata type, language and handler language not matching',
        );
        return null;
      }

      if (!(await exists(fs, codePath))) {
        this.logger.debug(`code path does not exist ${codePath}`);
        return null;
      }

      const jpc = podConfigurations.find(
        (x) => x.name === jobMetadata.jobPodConfigName,
      );
      if (!jpc) {
        this.logger.debug(
          `Job pod config not found: ${jobMetadata.jobPodConfigName}`,
        );
        return null;
      }

      job = {
        name: jobMetadata.name,
        code: (await fs.readFile(codePath)).toString(),
        language: jobMetadata.language,
        type: jobMetadata.type,
        builtIn: true,
        builtInFilePath: jobName,
        parameters: jobMetadata.parameters,
        jobPodConfigId: jpc._id,
        category: this.cleanCategory(jobMetadata.category),
      };

      if (await exists(fs, handlerPath)) {
        job.findingHandler = (await fs.readFile(handlerPath)).toString();
        job.findingHandlerEnabled = true;
        job.findingHandlerLanguage = jobMetadata.findingHandlerLanguage;
      }
    } catch (err) {
      this.logger.debug(err);
    }
    return job;
  }

  private cleanCategory(category: string) {
    if (category == null) return '/';
    if (category === '') return '/';
    if (!category.startsWith('/')) return `/${category}`;

    return category;
  }
}
