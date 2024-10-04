import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { Volume, createFsFromVolume } from 'memfs';
import Dirent from 'memfs/lib/Dirent';
import { FsPromisesApi } from 'memfs/lib/node/types';
import { CronSubscription } from './cron-subscriptions/cron-subscriptions.model';
import { EventSubscription } from './event-subscriptions/event-subscriptions.model';
import { SubscriptionWithType } from './subscriptions.type';
import { SubscriptionsUtils } from './subscriptions.utils';

export interface SubscriptionSource {
  synchronize(): Promise<(CronSubscription | EventSubscription)[]>;
}

export class GitSubscriptionSource implements SubscriptionSource {
  constructor(
    private url: string,
    private auth?: { username: string; password: string },
  ) {}

  public async synchronize(): Promise<SubscriptionWithType[]> {
    const fs = await this.checkout();

    const subscriptions = await this.listSubscriptions(fs, '/subscriptions');

    const importedSubscriptions: SubscriptionWithType[] = [];
    for (const subscription of subscriptions) {
      const importedSubscription =
        await SubscriptionsUtils.readSubscriptionFile(
          subscription.directory,
          subscription.name,
          fs,
        );
      importedSubscriptions.push(importedSubscription);
    }

    return importedSubscriptions;
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

  private async listSubscriptions(fs: FsPromisesApi, directory: string) {
    const directoryContent = (await fs.readdir(directory, {
      withFileTypes: true,
    })) as Dirent[];

    return directoryContent
      .filter((x) => !x.isDirectory())
      .map((x) => ({ directory, name: x.name.toString() }));
  }
}
