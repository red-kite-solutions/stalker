import { Injectable } from '@nestjs/common';
import { FsPromisesApi } from 'memfs/lib/node/types';
import { GitDataSource } from './data-source';
import { GitDataSourceConfig } from './git-data-source';

class DataSourceCacheEntry {
  fs: FsPromisesApi;
  expiration: number;
}

@Injectable()
export class DataSources {
  private readonly cacheTtlMs = 5 * 60 * 1000;

  private cache: { [key: string]: DataSourceCacheEntry } = {};

  public async get(config: GitDataSourceConfig): Promise<FsPromisesApi> {
    const cached = this.getFromCache(config);
    if (cached != null) return cached.fs;

    const dataSource = new GitDataSource(config);
    const fs = await dataSource.get();
    this.setInCache(config, fs);

    return fs;
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
    this.cache[key] = { expiration, fs };
  }

  private generateKey(config: GitDataSourceConfig) {
    return JSON.stringify(config);
  }
}
