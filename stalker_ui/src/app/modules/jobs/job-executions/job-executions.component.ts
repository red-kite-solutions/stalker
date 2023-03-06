import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { JobsSocketioClient } from '../../../api/jobs/jobs/jobs.socketio-client';
import { JobListEntry, StartedJob } from '../../../shared/types/jobs/job.type';

@Component({
  selector: 'app-job-executions',
  templateUrl: './job-executions.component.html',
  styleUrls: ['./job-executions.component.scss'],
})
export class JobExecutionsComponent implements OnDestroy {
  readonly displayColumns = ['name', 'time'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<StartedJob>();

  public selectedRow: JobListEntry | undefined;
  public data = new Array<StartedJob>();

  public dataSource$ = this.refreshData();
  private socketioClient: JobsSocketioClient;

  constructor(
    private dialog: MatDialog,
    private jobsService: JobsService,
    private toastr: ToastrService,
    private companiesService: CompaniesService,
    private titleService: Title,
    private authService: AuthService
  ) {
    this.titleService.setTitle($localize`:Launch Jobs|:Launch Jobs`);
    this.socketioClient = new JobsSocketioClient(this.authService);
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
