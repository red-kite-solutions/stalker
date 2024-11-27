import Dirent from 'memfs/lib/Dirent';
import { DataSource } from '../../datasources/data-sources';
import { JobPodConfigurationDocument } from '../admin/config/job-pod-config/job-pod-config.model';
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
    includeTemplates?: boolean,
  ): Promise<CustomJobEntry[]>;
}

export class GitJobSource implements JobSource {
  private jobReader = new JobReader();

  constructor(private dataSource: DataSource) {}

  public async synchronize(
    podConfigs: JobPodConfigurationDocument[],
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
      );

      importedJobs.push(importedJob);
    }

    return importedJobs;
  }

  private async listJobs(directory: string) {
    const directoryContent = (await this.dataSource.fs.readdir(directory, {
      withFileTypes: true,
    })) as Dirent[];

    return directoryContent
      .filter((x) => x.isDirectory())
      .map((x) => ({ directory, name: x.name.toString() }));
  }
}
