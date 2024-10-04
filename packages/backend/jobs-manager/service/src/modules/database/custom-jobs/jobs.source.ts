import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { Volume, createFsFromVolume } from 'memfs';
import Dirent from 'memfs/lib/Dirent';
import { FsPromisesApi } from 'memfs/lib/node/types';
import { JobPodConfigurationDocument } from '../admin/config/job-pod-config/job-pod-config.model';
import { CustomJobEntry } from './custom-jobs.model';
import { JobReader } from './job-reader';

export interface JobSource {
  synchronize(
    podConfigs: JobPodConfigurationDocument[],
  ): Promise<CustomJobEntry[]>;
}

export class GitJobSource implements JobSource {
  private jobReader = new JobReader();

  constructor(
    private url: string,
    private auth?: { username: string; password: string },
  ) {}

  public async synchronize(
    podConfigs: JobPodConfigurationDocument[],
    includeTemplates: boolean = false,
  ): Promise<CustomJobEntry[]> {
    const fs = await this.checkout();

    const jobs = await this.listJobs(fs, '/jobs');
    if (includeTemplates) {
      jobs.push(...(await this.listJobs(fs, '/job-templates')));
    }

    const importedJobs: CustomJobEntry[] = [];
    for (const job of jobs) {
      const importedJob = await this.jobReader.readJob(
        job.directory,
        job.name,
        podConfigs,
        fs,
      );
      importedJobs.push(importedJob);
    }

    return importedJobs;
  }

  private async checkout() {
    const memVolume = Volume.fromJSON({});
    const memFileSystem = createFsFromVolume(memVolume);

    await git.clone({
      fs: memFileSystem,
      http,
      url: this.url,
      dir: '/',
      onAuth: () => this.auth,
      ref: 'main',
      singleBranch: true,
      depth: 1,
    });

    return memFileSystem.promises;
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
