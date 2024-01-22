import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StartedJobViewModel } from '../../../shared/types/jobs/job.type';

@Component({
  standalone: true,
  selector: 'job-logs-summary',
  styleUrls: ['./job-execution-logs-summary.component.scss'],
  template: `
    @if (job?.numberOfErrors) {
      <span class="summary align"
        ><mat-icon class="error" [inline]="true">error</mat-icon> {{ job?.numberOfErrors }}</span
      >
    }
    @if (job?.numberOfWarnings) {
      <span class="summary"
        ><mat-icon class="warning" [inline]="true">warning</mat-icon> {{ job?.numberOfWarnings }}</span
      >
    }
    @if (job?.numberOfFindings) {
      <span class="summary"
        ><mat-icon class="finding" [inline]="true">lightbulb_circle</mat-icon> {{ job?.numberOfFindings }}</span
      >
    }
  `,
  imports: [MatIconModule],
})
export class JobLogsSummaryComponent {
  @Input() job: StartedJobViewModel | undefined;
}
