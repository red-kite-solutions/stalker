import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { CustomJobTemplatesService } from '../../../api/jobs/custom-job-templates/custom-job-templates.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { HasScopesDirective } from '../../../shared/directives/has-scopes.directive';
import { CustomJob } from '../../../shared/types/jobs/custom-job.type';
import { ElementMenuItems } from '../../../shared/widget/dynamic-icons/menu-icon.component';
import { FilteredPaginatedTableComponent } from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import {
  TABLE_FILTERS_SOURCE_INITAL_FILTERS,
  TableFilters,
  TableFiltersSource,
  TableFiltersSourceBase,
} from '../../../shared/widget/filtered-paginated-table/table-filters-source';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { AuthModule } from '../../auth/auth.module';
import { DataSourceComponent } from '../../data-source/data-source/data-source.component';
import { CustomJobsInteractionService } from './custom-jobs-interaction.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-list-custom-jobs',
  templateUrl: 'list-custom-jobs.component.html',
  styleUrls: ['./list-custom-jobs.component.scss'],
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
    MatTooltipModule,
    AuthModule,
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
export class ListCustomJobsComponent {
  public noDataMessage = $localize`:No job found|No job was found:No job found`;
  public isLoading$ = new BehaviorSubject(true);
  public selection = new SelectionModel<CustomJob>(true, []);

  private refreshData$ = new BehaviorSubject<void>(undefined);
  public customJobs$ = combineLatest([this.filtersSource.debouncedFilters$, this.refreshData$]).pipe(
    switchMap(([{ filters, pagination }]) =>
      this.jobsService.getCustomJobs(filters, pagination?.page ?? 0, pagination?.pageSize ?? 25)
    ),
    shareReplay(1)
  );

  public dataSource$ = this.customJobs$.pipe(
    map((customJob) => new MatTableDataSource<CustomJob>(customJob.items)),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private jobsService: JobsService,
    public customJobsInteractor: CustomJobsInteractionService,
    private titleService: Title,
    public templateService: CustomJobTemplatesService,
    public router: Router,
    public authService: AuthService,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Custom jobs list page title|:Custom jobs`);
  }

  public async deleteBatch(jobs: CustomJob[]) {
    const result = await this.customJobsInteractor.delete(jobs);
    if (result) this.refreshData$.next();
  }

  public async duplicate(job: CustomJob) {
    await this.customJobsInteractor.duplicate(job);
    this.refreshData$.next();
  }

  public async syncCache() {
    await this.customJobsInteractor.syncCache();
  }

  public generateMenuItem = (element: CustomJob): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.duplicate(element),
      icon: 'file_copy',
      label: $localize`:Duplicate a job|Duplicate a job:Duplicate`,
      requiredScopes: ['automation:custom-jobs:create'],
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete jobs|Delete jobs:Delete`,
      disabled: element.source != null,
      tooltip:
        element.source != null
          ? $localize`:Cannot delete imported jobs|Cannot delete imported jobs:You cannot delete imported jobs.`
          : undefined,
      requiredScopes: ['automation:custom-jobs:delete'],
    });

    return menuItems;
  };
}
