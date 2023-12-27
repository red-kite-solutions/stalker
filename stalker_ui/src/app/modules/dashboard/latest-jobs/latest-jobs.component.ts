import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { JobsService } from 'src/app/api/jobs/jobs/jobs.service';
import { JobLogsSummaryComponent } from '../../jobs/job-executions/job-execution-logs-summary.component';
import { JobStateComponent } from '../../jobs/job-executions/job-execution-state.component';

@Component({
  standalone: true,
  selector: 'latest-jobs',
  imports: [CommonModule, MatListModule, RouterModule, JobStateComponent, JobLogsSummaryComponent],
  styleUrls: ['../metric-styling.scss', './latest-job.component.scss'],
  template: `<span class="metric-title">Latest jobs</span>
    <mat-list class="metric-list">
      <mat-list-item *ngFor="let job of jobs$ | async">
        <span class="job">
          <app-job-state [state]="job.state"></app-job-state>
          <a class="metric-list-item" [routerLink]="['jobs', 'executions', job.id]">{{ job.task }}</a>
          <job-logs-summary [job]="job"></job-logs-summary>
        </span>
      </mat-list-item>
    </mat-list>`,
})
export class LatestJobs {
  public jobs$ = this.jobsService.getJobExecutions(0, 10).pipe(map((x) => x.items));

  constructor(private jobsService: JobsService) {}
}
