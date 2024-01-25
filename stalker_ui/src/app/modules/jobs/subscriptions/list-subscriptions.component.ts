import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
import { FilteredPaginatedTableComponent } from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
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
  ],
})
export class ListSubscriptionsComponent {
  public isLoading$ = new BehaviorSubject(true);
  public subscriptionTypes = subscriptionTypes;

  private filters$ = new BehaviorSubject<string[]>([]);
  public subscriptions$ = this.subscriptionsService.getSubscriptions().pipe(
    map((subscriptions) => subscriptions.sort((a, b) => a._id.localeCompare(b._id))),
    switchMap((subscriptions) =>
      this.filters$.pipe(
        debounceTime(250),
        map((filters) => filters.map((filter) => this.normalizeString(filter))),
        map((filters) => subscriptions.filter((sub) => !filters.length || this.filterSubscription(sub, filters)))
      )
    ),
    shareReplay(1)
  );

  public dataSource$ = this.subscriptions$.pipe(
    map((subscriptions) => new MatTableDataSource<EventSubscription | CronSubscription>(subscriptions)),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private subscriptionsService: SubscriptionService,
    private toastr: ToastrService,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
  }

  public delete() {}
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
    const parts = [subscription?.job?.name, subscription?.name, cron.cronExpression, event.finding];
    return filters.some((filter) => this.normalizeString(parts.join(' ')).includes(filter));
  }

  private normalizeString(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
