import Dirent from 'memfs/lib/Dirent';
import { FsPromisesApi } from 'memfs/lib/node/types';
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
}

export interface JobSource {
  synchronize(
    podConfigs: JobPodConfigurationDocument[],
    includeTemplates?: boolean,
  ): Promise<CustomJobEntry[]>;
}

export class GitJobSource implements JobSource {
  private jobReader = new JobReader();

  constructor(private fs: FsPromisesApi) {}

  public async synchronize(
    podConfigs: JobPodConfigurationDocument[],
    includeTemplates: boolean = false,
  ): Promise<CustomJobEntry[]> {
    const jobs = await this.listJobs(this.fs, '/jobs');
    if (includeTemplates) {
      jobs.push(...(await this.listJobs(this.fs, '/job-templates')));
    }

    const importedJobs: CustomJobEntry[] = [];
    for (const job of jobs) {
      const importedJob = await this.jobReader.readJob(
        job.directory,
        job.name,
        podConfigs,
        this.fs,
      );
      importedJobs.push(importedJob);
    }

    return importedJobs;
  }

  private async listJobs(fs: FsPromisesApi, directory: string) {
    const directoryContent = (await fs.readdir(directory, {
      withFileTypes: true,
    })) as Dirent[];

    return directoryContent
      .filter((x) => x.isDirectory())
      .map((x) => ({ directory, name: x.name.toString() }));
  }
}
