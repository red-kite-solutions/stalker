import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { JobsSocketioService } from '../../../api/jobs/jobs/jobs.socketio-service';
import { JobListEntry, StartedJob } from '../../../shared/types/jobs/job.type';

@Component({
  selector: 'app-job-executions',
  templateUrl: './job-executions.component.html',
  styleUrls: ['./job-executions.component.scss'],
})
export class JobExecutionsComponent implements OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<StartedJob>();

  public selectedRow: JobListEntry | undefined;
  public currentJobName = '';
  public currentJobSource = '';
  public data = new Array<StartedJob>();

  public dataSource$ = this.refreshData();

  constructor(
    private dialog: MatDialog,
    private jobsService: JobsService,
    private toastr: ToastrService,
    private companiesService: CompaniesService,
    private titleService: Title,
    private jobsSocketioService: JobsSocketioService
  ) {
    this.titleService.setTitle($localize`:Launch Jobs|:Launch Jobs`);
  }

  private refreshData() {
    return this.jobsService.getJobExecutions().pipe(
      map((data: StartedJob[]) => {
        this.data = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      })
    );
  }

  ngOnDestroy(): void {
    // Do nothing for now
  }
}
