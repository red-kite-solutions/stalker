import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { Volume, createFsFromVolume } from 'memfs';
import { FsPromisesApi } from 'memfs/lib/node/types';
import { DataSource } from './data-source';

export interface GitDataSourceConfig {
  type: 'git';
  url: string;
  auth?: {
    username: string;
    password: string;
  };
}

export class GitDataSource implements DataSource {
  constructor(private config: GitDataSourceConfig) {}

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
