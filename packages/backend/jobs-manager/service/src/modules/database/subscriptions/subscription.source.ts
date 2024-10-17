import Dirent from 'memfs/lib/Dirent';
import { FsPromisesApi } from 'memfs/lib/node/types';
import { SubscriptionWithType } from './subscriptions.type';
import { SubscriptionsUtils } from './subscriptions.utils';

export interface SubscriptionSource {
  synchronize(): Promise<SubscriptionWithType[]>;
}

export class GitSubscriptionSource implements SubscriptionSource {
  constructor(private fs: FsPromisesApi) {}

  public async synchronize(): Promise<SubscriptionWithType[]> {
    const subscriptions = await this.listSubscriptions(
      this.fs,
      '/subscriptions',
    );

    const importedSubscriptions: SubscriptionWithType[] = [];
    for (const subscription of subscriptions) {
      const importedSubscription =
        await SubscriptionsUtils.readSubscriptionFile(
          subscription.directory,
          subscription.name,
          this.fs,
        );
      importedSubscriptions.push(importedSubscription);
    }

    return importedSubscriptions;
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
