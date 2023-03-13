import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { JobsSocketioClient } from '../../../api/jobs/jobs/jobs.socketio-client';
import { CompanySummary } from '../../../shared/types/company/company.summary';
import { StartedJob } from '../../../shared/types/jobs/job.type';
import { Page } from '../../../shared/types/page.type';

@Component({
  selector: 'app-job-executions',
  templateUrl: './job-executions.component.html',
  styleUrls: ['./job-executions.component.scss'],
})
export class JobExecutionsComponent implements OnDestroy {
  readonly displayColumns = ['name', 'company', 'time'];
  readonly filterOptions: string[] = ['company'];

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  dataLoading = true;
  dataSource = new MatTableDataSource<StartedJob>();
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
    map((data: Page<StartedJob>) => {
      if (!this.dataSource) {
        this.dataSource = new MatTableDataSource<StartedJob>();
      }
      this.dataSource.data = data.items;
      this.count = data.totalRecords;
      this.dataLoading = false;
      return data;
    })
  );

  private socketioClient: JobsSocketioClient;

  companies: CompanySummary[] = [];
  companies$ = this.companiesService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: CompanySummary[] = [];
      for (const company of next) {
        comp.push({ id: company._id, name: company.name });
      }
      this.companies = comp;
      return this.companies;
    })
  );

  constructor(
    private dialog: MatDialog,
    private jobsService: JobsService,
    private companiesService: CompaniesService,
    private titleService: Title,
    private authService: AuthService,
    private toastrService: ToastrService
  ) {
    this.titleService.setTitle($localize`:Job executions|:Job executions`);
    this.socketioClient = new JobsSocketioClient(this.authService);
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
          if (company) filterObject['company'] = company.id;
          else
            this.toastrService.warning(
              $localize`:Company does not exist|The given company name is not known to the application:Company name not recognized`
            );
          break;
      }
    }
    return filterObject;
  }

  ngOnDestroy(): void {
    // Do nothing for now
  }
}
