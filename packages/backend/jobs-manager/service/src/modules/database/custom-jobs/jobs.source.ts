import { Logger } from '@nestjs/common';
import Dirent from 'memfs/lib/Dirent';
import { DataSource } from '../../datasources/data-sources';
import { JobPodConfigurationDocument } from '../admin/config/job-pod-config/job-pod-config.model';
import { JobContainerDocument } from '../container/job-container.model';
import { CustomJobEntry } from './custom-jobs.model';
import { JobReader } from './job-reader';

export interface JobSourceConfig {
  type: 'git';
  url: string;
  auth?: {
    username: string;
    password: string;
  };
  branch: string;
}

export interface JobSource {
  synchronize(
    podConfigs: JobPodConfigurationDocument[],
    containers: JobContainerDocument[],
    includeTemplates?: boolean,
  ): Promise<CustomJobEntry[]>;
}

export class GitJobSource implements JobSource {
  private jobReader = new JobReader();
  private logger = new Logger(GitJobSource.name);

  constructor(private dataSource: DataSource) {}

  public async synchronize(
    podConfigs: JobPodConfigurationDocument[],
    containers: JobContainerDocument[],
    includeTemplates: boolean = false,
  ): Promise<CustomJobEntry[]> {
    const jobs = await this.listJobs('/jobs');

    if (includeTemplates) {
      jobs.push(...(await this.listJobs('/job-templates')));
    }

    const importedJobs: CustomJobEntry[] = [];
    for (const job of jobs) {
      const importedJob = await this.jobReader.readJob(
        job.directory,
        job.name,
        podConfigs,
        this.dataSource,
        containers,
      );

      importedJobs.push(importedJob);
    }

    return importedJobs;
  }

  private async listJobs(directory: string) {
    let directoryContent: Dirent[] = [];
    try {
      directoryContent = (await this.dataSource.fs.readdir(directory, {
        withFileTypes: true,
      })) as Dirent[];
    } catch (err) {
      this.logger.warn(
        `Unable to read directory ${directory} from data source ${this.dataSource.repoUrl} (branch: ${this.dataSource.branch})`,
      );
      return [];
    }

    return directoryContent
      .filter((x) => x.isDirectory())
      .map((x) => ({ directory, name: x.name.toString() }));
  }
}
