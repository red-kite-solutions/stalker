import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, debounceTime, map, shareReplay, switchMap, tap } from 'rxjs';
import { SubscriptionService, SubscriptionType } from 'src/app/api/jobs/subscriptions/subscriptions.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import {
  CronSubscription,
  EventSubscription,
  SubscriptionData,
} from 'src/app/shared/types/subscriptions/subscription.type';
import {
  ElementMenuItems,
  FilteredPaginatedTableComponent,
} from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { DisabledPillTagComponent } from 'src/app/shared/widget/pill-tag/disabled-pill-tag.component';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { SubscriptionInteractionService } from './subscription-interaction.service';
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
    TableFormatComponent,
  ],
})
export class ListSubscriptionsComponent {
  public isLoading$ = new BehaviorSubject(true);
  public subscriptionTypes = subscriptionTypes;
  public noDataMessage = $localize`:No subscription found|No subscriptions were found:No subscription found`;
  public selection = new SelectionModel<CronSubscription | EventSubscription>(true, []);

  currentPage: PageEvent = this.generateFirstPageEvent();
  public currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
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

  public dataSource$ = combineLatest([this.currentPage$, this.subscriptions$]).pipe(
    map(([page, subscriptions]) => {
      const start = page.pageIndex * page.pageSize;
      let end = start + page.pageSize;
      end = end < subscriptions.length ? end : subscriptions.length;
      return new MatTableDataSource<EventSubscription | CronSubscription>(subscriptions.slice(start, end));
    }),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  private generateFirstPageEvent(pageSize: number = 10) {
    const p = new PageEvent();
    p.pageIndex = 0;
    p.pageSize = pageSize;
    this.currentPage = p;
    return p;
  }

  constructor(
    private subscriptionsService: SubscriptionService,
    private titleService: Title,
    private subscriptionInteractor: SubscriptionInteractionService
  ) {
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
  }

  public async deleteBatch(subscriptions: (CronSubscription | EventSubscription)[]) {
    const result = await this.subscriptionInteractor.deleteBatch(subscriptions);
    if (result) {
      this.refreshData$.next();
    }
  }

  public async updateEnabled(id: string, type: SubscriptionType, isEnabled: boolean) {
    const result = await this.subscriptionInteractor.updateIsEnabled(id, type, isEnabled);
    if (result) {
      this.refreshData$.next();
    }
  }

  public pageChange(e: PageEvent) {
    this.currentPage$.next(e);
  }

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

  public generateMenuItem = (element: CronSubscription | EventSubscription): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    const { _id, type } = element;
    if (element.isEnabled) {
      menuItems.push({
        icon: 'pause',
        label: $localize`:Disable|Disables a subscription:Disable`,
        action: () => this.updateEnabled(_id, type, false),
      });
    } else {
      menuItems.push({
        icon: 'play_arrow',
        label: $localize`:Enable|Enables a subscription:Enable`,
        action: () => this.updateEnabled(_id, type, true),
      });
    }

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete subscription|Delete subscription:Delete`,
    });

    return menuItems;
  };
}
