import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { SubscriptionService, SubscriptionType } from 'src/app/api/jobs/subscriptions/subscriptions.service';
import { CronSubscription, EventSubscription } from 'src/app/shared/types/subscriptions/subscription.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class SubscriptionInteractionService {
  constructor(
    private subscriptionService: SubscriptionService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public async updateIsEnabled(id: string, type: SubscriptionType, isEnabled: boolean): Promise<boolean> {
    if (id === null) return false;

    try {
      await this.subscriptionService.updateIsEnabled(type, id, isEnabled);

      const message = isEnabled
        ? $localize`:Subscription enabled|The subscription has been enabled:Subscription successfully enabled`
        : $localize`:Subscription disabled|The subscription has been disabled:Subscription successfully disabled`;

      this.toastr.success(message);
      return true;
    } catch (err) {
      const errorDeleting = $localize`:Error while toggling subscription state|Error while toggling subscription state:Error while toggling subscription state`;
      this.toastr.error(errorDeleting);
      return false;
    }
  }

  public async revertToOriginal(id: string, type: SubscriptionType): Promise<boolean> {
    const data: ConfirmDialogData = {
      text: $localize`:Confirm revert to original|Confirmation message asking if the user really wants to revert the subscription to the original configuraton:Do you really wish to revert this subscription to its original configuration?`,
      title: $localize`:Reverting subscription to original|Title of a page to revert a subscription to the original configuration:Revert to original`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Revert to original|Confirm that the user wants to revert the subscription to its original configuration:Revert to original`,
      onPrimaryButtonClick: (close) => {
        close(false);
      },
      onDangerButtonClick: async (close) => {
        try {
          if (id == null) throw new Error('Id is null.');

          await this.subscriptionService.revert(type, id);

          this.toastr.success(
            $localize`:Subscription reverted|The subscription has been reverted to its original configuration:Subscription successfully reverted to its original configuration`
          );

          close(true);
        } catch (err) {
          const errorReverting = $localize`:Error while deleting|Error while deleting an item:Error while deleting`;
          this.toastr.error(errorReverting);
          close(false);
        }
      },
    };

    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          restoreFocus: false,
        })
        .afterClosed()
    );
  }

  public async deleteBatch(subscriptions: Pick<CronSubscription | EventSubscription, '_id' | 'type' | 'name'>[]) {
    let data: ConfirmDialogData = {
      text: $localize`:Select subscriptions again|No subscription was selected so there is nothing to delete:Select the subscriptions to delete and try again.`,
      title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
      primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
      noDataSelectItem: true,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
    };

    const bulletPoints = subscriptions.map((x) => x.name);

    if (subscriptions.length > 0) {
      data = {
        text: $localize`:Confirm subscription deletion|Confirmation message asking if the user really wants to delete this subscription:Do you really wish to delete these subscriptions permanently ?`,
        title: $localize`:Deleting subscriptions|Title of a page to delete a subscription:Deleting subscriptions`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: bulletPoints,
        onPrimaryButtonClick: (close) => {
          close(false);
        },
        onDangerButtonClick: async (close) => {
          for (const sub of subscriptions) {
            try {
              await this.subscriptionService.delete(sub.type, sub._id);
            } catch {
              this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
            }
          }

          this.toastr.success(
            $localize`:Successfully deleted subscription|Successfully deleted subscription:Successfully deleted subscription`
          );

          close(true);
        },
      };
    }

    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          restoreFocus: false,
        })
        .afterClosed()
    );
  }
}
