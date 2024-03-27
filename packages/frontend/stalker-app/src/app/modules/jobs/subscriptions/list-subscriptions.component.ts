import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, debounceTime, map, shareReplay, switchMap, tap } from 'rxjs';
import { SubscriptionService } from 'src/app/api/jobs/subscriptions/subscriptions.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import {
  CronSubscription,
  EventSubscription,
  SubscriptionData,
} from 'src/app/shared/types/subscriptions/subscription.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { FilteredPaginatedTableComponent } from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { DisabledPillTagComponent } from 'src/app/shared/widget/pill-tag/disabled-pill-tag.component';
import { subscriptionTypes } from './subscription-templates';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-list-subscriptions',
  templateUrl: 'list-subscriptions.component.html',
  styleUrls: ['./list-subscriptions.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    AvatarComponent,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    FilteredPaginatedTableComponent,
    MatDialogModule,
    MatTooltipModule,
    DisabledPillTagComponent,
  ],
})
export class ListSubscriptionsComponent {
  public isLoading$ = new BehaviorSubject(true);
  public subscriptionTypes = subscriptionTypes;
  public noDataMessage = $localize`:No subscription found|No subscriptions were found:No subscription found`;
  public selection = new SelectionModel<CronSubscription | EventSubscription>(true, []);

  private filters$ = new BehaviorSubject<string[]>([]);
  private refreshData$ = new BehaviorSubject<void>(undefined);
  public subscriptions$ = this.refreshData$.pipe(
    switchMap(() =>
      this.subscriptionsService.getSubscriptions().pipe(
        map((subscriptions) => subscriptions.sort((a, b) => a._id.localeCompare(b._id))),
        switchMap((subscriptions) =>
          this.filters$.pipe(
            debounceTime(250),
            map((filters) => filters.map((filter) => this.normalizeString(filter))),
            map((filters) => subscriptions.filter((sub) => !filters.length || this.filterSubscription(sub, filters)))
          )
        ),
        shareReplay(1)
      )
    )
  );

  public dataSource$ = this.subscriptions$.pipe(
    map((subscriptions) => new MatTableDataSource<EventSubscription | CronSubscription>(subscriptions)),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private subscriptionsService: SubscriptionService,
    private toastr: ToastrService,
    private titleService: Title,
    private dialog: MatDialog
  ) {
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
  }

  public async delete() {
    let data: ConfirmDialogData = {
      text: $localize`:Select subscriptions again|No subscription was selected so there is nothing to delete:Select the subscriptions to delete and try again.`,
      title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
      primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
    };

    const bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((sub: SubscriptionData) => {
      const bp = sub.name;
      bulletPoints.push(bp);
    });

    if (this.selection.selected.length > 0) {
      data = {
        text: $localize`:Confirm subscription deletion|Confirmation message asking if the user really wants to delete this subscription:Do you really wish to delete these subscriptions permanently ?`,
        title: $localize`:Deleting subscriptions|Title of a page to delete a subscription:Deleting subscriptions`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: bulletPoints,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async () => {
          for (const sub of this.selection.selected) {
            try {
              await this.subscriptionsService.delete(sub.type, sub._id);
            } catch {
              this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
              return;
            }
          }

          this.toastr.success(
            $localize`:Successfully deleted subscription|Successfully deleted subscription:Successfully deleted subscription`
          );

          this.refreshData$.next();
          this.dialog.closeAll();
        },
      };
    }

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  public revertToDefault() {}
  public pageChange(e: any) {}
  public filterChange(filters: string[]) {
    this.filters$.next(filters);
  }

  public getSubscriptionQueryParams(row: SubscriptionData) {
    return { type: row.type };
  }

  private filterSubscription(subscription: EventSubscription | CronSubscription, filters: string[]) {
    const event = subscription as EventSubscription;
    const cron = subscription as CronSubscription;
    const parts = [
      subscription.job?.name,
      subscription.name,
      cron.cronExpression,
      event.finding,
      cron.cronExpression ? 'cron' : 'event',
      subscription.isEnabled === false ? 'disabled' : 'enabled',
    ];
    return filters.some((filter) => this.normalizeString(parts.join(' ')).includes(filter));
  }

  private normalizeString(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
