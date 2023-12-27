import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StartedJobViewModel } from '../../../shared/types/jobs/job.type';

@Component({
  standalone: true,
  selector: 'job-logs-summary',
  styleUrls: ['./job-execution-logs-summary.component.scss'],
  template: `
    <span class="summary align" *ngIf="job?.numberOfErrors"
      ><mat-icon class="error" [inline]="true">error</mat-icon> {{ job?.numberOfErrors }}</span
    >
    <span class="summary" *ngIf="job?.numberOfWarnings"
      ><mat-icon class="warning" [inline]="true">warning</mat-icon> {{ job?.numberOfWarnings }}</span
    >
    <span class="summary" *ngIf="job?.numberOfFindings"
      ><mat-icon class="finding" [inline]="true">lightbulb_circle</mat-icon> {{ job?.numberOfFindings }}</span
    >
  `,
  imports: [CommonModule, MatIconModule],
})
export class JobLogsSummaryComponent {
  @Input() job: StartedJobViewModel | undefined;
}
