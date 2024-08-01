import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { ProjectCellComponent } from 'src/app/shared/components/project-cell/project-cell.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Project } from 'src/app/shared/types/project/project.interface';
import { FilteredPaginatedTableComponent } from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { StartedJobViewModel } from '../../../shared/types/jobs/job.type';
import { Page } from '../../../shared/types/page.type';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
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
})
export class JobExecutionsComponent {
  readonly displayColumns = ['name', 'project', 'time'];
  readonly filterOptions: string[] = ['project'];
  public readonly noDataMessage = $localize`:No job history|No jobs were run up to this point:No job history`;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  dataLoading = true;
  dataSource = new MatTableDataSource<StartedJobViewModel>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = [];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  count = 0;

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.jobsService.getJobExecutions(currentPage.pageIndex, currentPage.pageSize, filters);
    }),
    map((data: Page<StartedJobViewModel>) => {
      if (!this.dataSource) {
        this.dataSource = new MatTableDataSource<StartedJobViewModel>();
      }
      this.dataSource.data = data.items;
      this.count = data.totalRecords;
      this.dataLoading = false;
      return data;
    })
  );

  projects: Project[] = [];
  projects$ = this.projectsService.getAll().pipe(tap((x) => (this.projects = x)));

  constructor(
    private jobsService: JobsService,
    private projectsService: ProjectsService,
    private titleService: Title,
    private toastrService: ToastrService
  ) {
    this.titleService.setTitle($localize`:Job executions|:Job executions`);
  }

  private generateFirstPageEvent() {
    const p = new PageEvent();
    p.pageIndex = 0;
    p.pageSize = 10;
    this.currentPage = p;
    return p;
  }

  filtersChange(filters: string[]) {
    this.currentFilters = filters;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
  }

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
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
}
