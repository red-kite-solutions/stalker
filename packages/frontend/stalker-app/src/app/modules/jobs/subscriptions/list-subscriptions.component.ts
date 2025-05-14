import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';
import { SubscriptionService, SubscriptionType } from '../../../api/jobs/subscriptions/subscriptions.service';
import { HasScopesDirective } from '../../../shared/directives/has-scopes.directive';
import {
  CronSubscription,
  EventSubscription,
  SubscriptionData,
} from '../../../shared/types/subscriptions/subscription.type';
import { ElementMenuItems } from '../../../shared/widget/dynamic-icons/menu-icon.component';
import { FilteredPaginatedTableComponent } from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import {
  TABLE_FILTERS_SOURCE_INITAL_FILTERS,
  TableFilters,
  TableFiltersSource,
  TableFiltersSourceBase,
} from '../../../shared/widget/filtered-paginated-table/table-filters-source';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { DisabledPillTagComponent } from '../../../shared/widget/pill-tag/disabled-pill-tag.component';
import { DataSourceComponent } from '../../data-source/data-source/data-source.component';
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
    DataSourceComponent,
    HasScopesDirective,
  ],
  providers: [
    { provide: TableFiltersSourceBase, useClass: TableFiltersSource },
    {
      provide: TABLE_FILTERS_SOURCE_INITAL_FILTERS,
      useValue: {
        filters: [],
        pagination: { page: 0, pageSize: 25 },
      } as TableFilters,
    },
  ],
})
export class ListSubscriptionsComponent {
  public isLoading$ = new BehaviorSubject(true);
  public subscriptionTypes = subscriptionTypes;
  public noDataMessage = $localize`:No subscription found|No subscriptions were found:No subscription found`;
  public selection = new SelectionModel<CronSubscription | EventSubscription>(true, []);

  private refreshData$ = new BehaviorSubject<void>(undefined);
  public subscriptions$ = combineLatest([this.filtersSource.debouncedFilters$, this.refreshData$]).pipe(
    switchMap(([{ filters, pagination }]) =>
      this.subscriptionsService
        .getSubscriptions(filters, pagination?.page ?? 0, pagination?.pageSize ?? 25)
        .pipe(shareReplay(1))
    )
  );

  public dataSource$ = this.subscriptions$.pipe(
    map((subscriptions) => new MatTableDataSource<EventSubscription | CronSubscription>(subscriptions.items)),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private subscriptionsService: SubscriptionService,
    private titleService: Title,
    private subscriptionInteractor: SubscriptionInteractionService,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
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

  public async duplicate(sub: EventSubscription | CronSubscription) {
    await this.subscriptionInteractor.duplicate(sub);
    this.refreshData$.next();
  }

  public getSubscriptionQueryParams(row: SubscriptionData) {
    return { type: row.type };
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
        requiredScopes: ['automation:subscriptions:update'],
      });
    } else {
      menuItems.push({
        icon: 'play_arrow',
        label: $localize`:Enable|Enables a subscription:Enable`,
        action: () => this.updateEnabled(_id, type, true),
        requiredScopes: ['automation:subscriptions:update'],
      });
    }

    menuItems.push({
      action: () => this.duplicate(element),
      icon: 'file_copy',
      label: $localize`:Duplicate a job|Duplicate a job:Duplicate`,
      requiredScopes: ['automation:subscriptions:create'],
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete subscription|Delete subscription:Delete`,
      disabled: element.source != null,
      tooltip:
        element.source != null
          ? $localize`:Cannot delete imported jobs|Cannot delete imported jobs:You cannot delete imported subscriptions.`
          : undefined,
      requiredScopes: ['automation:subscriptions:delete'],
    });

    return menuItems;
  };
}
