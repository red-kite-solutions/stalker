import Dirent from 'memfs/lib/Dirent';
import { DataSource } from '../../datasources/data-sources';
import { SubscriptionWithType } from './subscriptions.type';
import { SubscriptionsUtils } from './subscriptions.utils';

export interface SubscriptionSource {
  synchronize(): Promise<SubscriptionWithType[]>;
}

export class GitSubscriptionSource implements SubscriptionSource {
  constructor(private dataSource: DataSource) {}

  public async synchronize(): Promise<SubscriptionWithType[]> {
    const subscriptions = await this.listSubscriptions('/subscriptions');

    const importedSubscriptions: SubscriptionWithType[] = [];
    for (const subscription of subscriptions) {
      const importedSubscription =
        await SubscriptionsUtils.readSubscriptionFile(
          subscription.directory,
          subscription.name,
          this.dataSource,
        );
      importedSubscriptions.push(importedSubscription);
    }

    return importedSubscriptions;
  }

  private async listSubscriptions(directory: string) {
    const directoryContent = (await this.dataSource.fs.readdir(directory, {
      withFileTypes: true,
    })) as Dirent[];

    return directoryContent
      .filter((x) => !x.isDirectory())
      .map((x) => ({ directory, name: x.name.toString() }));
  }
}
