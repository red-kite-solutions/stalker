import { Injectable } from '@nestjs/common';
import { FsPromisesApi } from 'memfs/lib/node/types';
import { GitDataSource } from './data-source';
import { GitDataSourceConfig } from './git-data-source';

export interface DataSource {
  type: 'git';
  repoUrl: string;
  avatarUrl: string;
  fs: FsPromisesApi;
}

interface DataSourceCacheEntry extends DataSource {
  expiration: number;
}

@Injectable()
export class DataSources {
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private cache: { [key: string]: DataSourceCacheEntry } = {};

  public async get(config: GitDataSourceConfig): Promise<DataSourceCacheEntry> {
    const cached = this.getFromCache(config);
    if (cached != null) return cached;

    const dataSource = new GitDataSource(config);
    const fs = await dataSource.get();
    this.setInCache(config, fs);

    return this.getFromCache(config);
  }

  private getFromCache(config: GitDataSourceConfig) {
    const key = this.generateKey(config);
    const cached = this.cache[key];

    if (cached == null) return;

    const now = new Date().getUTCMilliseconds();
    if (cached.expiration < now) return;

    return cached;
  }

  private setInCache(config: GitDataSourceConfig, fs: FsPromisesApi) {
    const now = new Date().getUTCMilliseconds();
    const expiration = now + this.cacheTtlMs;
    const key = this.generateKey(config);
    this.cache[key] = {
      type: 'git',
      expiration,
      fs,
      avatarUrl: this.inferAvatar(config.url),
      repoUrl: config.url,
    };
  }

  private generateKey(config: GitDataSourceConfig) {
    return JSON.stringify(config);
  }

  private inferAvatar(repoUrl: string) {
    let match = repoUrl.match(/https:\/\/github.com\/([^\/]*)\//);
    if (match) {
      return `https://github.com/${match[1]}.png`;
    }

    return undefined;
  }
}
