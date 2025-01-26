import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { JobExecutionsService } from '../../../api/jobs/job-executions/job-executions.service';
import { globalProjectFilter$ } from '../../../utils/global-project-filter';
import { JobLogsSummaryComponent } from '../../jobs/job-executions/job-execution-logs-summary.component';
import { JobStateComponent } from '../../jobs/job-executions/job-execution-state.component';

@Component({
  standalone: true,
  selector: 'latest-jobs',
  imports: [CommonModule, MatListModule, RouterModule, JobStateComponent, JobLogsSummaryComponent, MatButtonModule],
  styleUrls: ['../metric-styling.scss'],
  template: `<span class="metric-title" i18n="Latest jobs|Latest jobs that ran">Latest jobs</span>
    <mat-list class="metric-list">
      @for (job of jobs$ | async; track job) {
        <mat-list-item>
          <span class="tw-flex tw-gap-2 tw-items-center tw-w-full">
            <app-job-state [state]="job.state"></app-job-state>
            <a [routerLink]="['jobs', 'executions', job.id]">{{ job.name }}</a>
            <job-logs-summary class="tw-opacity-50 tw-text-xs" [job]="job"></job-logs-summary>
          </span>
        </mat-list-item>
      }

      <mat-list-item>
        @if ((jobs$ | async)?.length === 0) {
          <span i18n="No executions yet. Start by|No executions yet. Start by">No executions yet. Start by</span>
          <a mat-button color="primary" routerLink="/domains" i18n="Adding a domain|Adding a domain">adding domains</a
          ><span>?</span>
        }
      </mat-list-item>
    </mat-list>`,
})
export class LatestJobs {
  public jobs$ = globalProjectFilter$.pipe(
    switchMap((project) => {
      const filters: any = {};
      if (project) filters.project = project.id;
      return this.jobsService.getJobExecutions(0, 10, filters).pipe(map((x) => x.items));
    })
  );

  constructor(private jobsService: JobExecutionsService) {}
}
