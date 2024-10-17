import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { Volume, createFsFromVolume } from 'memfs';
import { FsPromisesApi } from 'memfs/lib/node/types';

export interface DataSourceConfig {
  type: 'git';
  url: string;
  auth?: {
    username: string;
    password: string;
  };
}

export interface DataSource {
  get(): Promise<FsPromisesApi>;
}

export class GitDataSource implements DataSource {
  constructor(private config: DataSourceConfig) {}

  public async get(): Promise<FsPromisesApi> {
    const memVolume = Volume.fromJSON({});
    const memFileSystem = createFsFromVolume(memVolume);

    await git.clone({
      fs: memFileSystem,
      http,
      url: this.config.url,
      dir: '/',
      onAuth: () => this.config.auth,
      ref: 'main',
      singleBranch: true,
      depth: 1,
    });

    return memFileSystem.promises;
  }
}
