import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { CompanyCellComponent } from 'src/app/shared/components/company-cell/company-cell.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Company } from 'src/app/shared/types/company/company.interface';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { StartedJobViewModel } from '../../../shared/types/jobs/job.type';
import { Page } from '../../../shared/types/page.type';
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
    CompanyCellComponent,
  ],
})
export class JobExecutionsComponent {
  readonly displayColumns = ['name', 'company', 'time'];
  readonly filterOptions: string[] = ['company'];

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

  companies: Company[] = [];
  companies$ = this.companiesService.getAll().pipe(tap((x) => (this.companies = x)));

  constructor(
    private jobsService: JobsService,
    private companiesService: CompaniesService,
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
        case 'company':
          const company = this.companies.find((c) => c.name.trim().toLowerCase() === value.trim().toLowerCase());
          if (company) filterObject['company'] = company._id;
          else
            this.toastrService.warning(
              $localize`:Company does not exist|The given company name is not known to the application:Company name not recognized`
            );
          break;
      }
    }
    return filterObject;
  }
}
