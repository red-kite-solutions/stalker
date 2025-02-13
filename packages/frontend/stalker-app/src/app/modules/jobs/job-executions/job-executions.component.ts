import { CommonModule } from '@angular/common';
import { Component, Inject, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';
import { JobExecutionsService } from '../../../api/jobs/job-executions/job-executions.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { ProjectCellComponent } from '../../../shared/components/project-cell/project-cell.component';
import { SharedModule } from '../../../shared/shared.module';
import { StartedJobViewModel } from '../../../shared/types/jobs/job.type';
import { Project } from '../../../shared/types/project/project.interface';
import { ElementMenuItems } from '../../../shared/widget/dynamic-icons/menu-icon.component';
import { FilteredPaginatedTableComponent } from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import {
  TABLE_FILTERS_SOURCE_INITAL_FILTERS,
  TableFilters,
  TableFiltersSource,
  TableFiltersSourceBase,
} from '../../../shared/widget/filtered-paginated-table/table-filters-source';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { JobExecutionInteractionsService } from './job-execution-interactions.service';
import { JobLogsSummaryComponent } from './job-execution-logs-summary.component';
import { JobStateComponent } from './job-execution-state.component';

@Component({
  standalone: true,
  selector: 'app-job-executions',
  templateUrl: './job-executions.component.html',
  styleUrls: ['./job-executions.component.scss'],
  imports: [
    CommonModule,
    SharedModule,
    JobStateComponent,
    JobLogsSummaryComponent,
    MatCardModule,
    MatTableModule,
    ProjectCellComponent,
    FilteredPaginatedTableComponent,
    RouterModule,
    TableFormatComponent,
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
export class JobExecutionsComponent {
  readonly displayColumns = ['name', 'project', 'time', 'menu'];
  readonly filterOptions: string[] = ['project'];
  public readonly noDataMessage = $localize`:No job history|No jobs were run up to this point:No job history`;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  dataLoading = true;

  private refresh$ = new BehaviorSubject(null);

  executions$ = combineLatest([this.filtersSource.debouncedFilters$, this.refresh$]).pipe(
    switchMap(([{ filters, pagination }]) =>
      this.jobsService.getJobExecutions(pagination?.page ?? 0, pagination?.pageSize ?? 25, this.buildFilters(filters))
    ),
    tap(() => (this.dataLoading = false)),
    shareReplay(1)
  );

  dataSource$ = this.executions$.pipe(map((x) => new MatTableDataSource<StartedJobViewModel>(x.items)));

  projects: Project[] = [];
  projects$ = this.projectsService.getAll().pipe(tap((x) => (this.projects = x)));

  constructor(
    private jobsService: JobExecutionsService,
    private projectsService: ProjectsService,
    private titleService: Title,
    private toastrService: ToastrService,
    private jobExecutionInteractionsService: JobExecutionInteractionsService,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Job executions|:Job executions`);
  }

  buildFilters(stringFilters: string[]): any {
    const SEPARATOR = ':';
    const filterObject: any = {};

    for (const filter of stringFilters) {
      if (filter.indexOf(SEPARATOR) === -1) continue;

      const keyValuePair = filter.split(SEPARATOR);

      if (keyValuePair.length !== 2) continue;

      const key = keyValuePair[0].trim().toLowerCase();
      const value = keyValuePair[1].trim().toLowerCase();

      if (!key || !value) continue;

      switch (key) {
        case 'project':
          const project = this.projects.find((c) => c.name.trim().toLowerCase() === value.trim().toLowerCase());
          if (project) filterObject['project'] = project._id;
          else
            this.toastrService.warning(
              $localize`:Project does not exist|The given project name is not known to the application:Project name not recognized`
            );
          break;
      }
    }
    return filterObject;
  }

  stopSent = new Set<string>();

  public async stopJob(jobId: string) {
    const result = await this.jobExecutionInteractionsService.stopJob(jobId);
    if (result) {
      this.stopSent.add(jobId);
    }
  }

  public generateMenuItem = (element: StartedJobViewModel): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.stopJob(element.id),
      icon: 'stop_circle',
      label: $localize`:Stop job|Stop the currently running job:Stop job`,
      disabled: !!element.endTime || this.stopSent.has(element.id),
    });

    return menuItems;
  };
}
