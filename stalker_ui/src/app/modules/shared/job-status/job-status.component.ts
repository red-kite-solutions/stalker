import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'job-status',
  template: ` <span class="summary"
        >@if (job?.numberOfErrors) {
        <mat-icon class="error" [inline]="true">error</mat-icon>
      }
      {{ job?.numberOfErrors }}</span
      >
      @if (job?.numberOfWarnings) {
        <span class="summary"
          ><mat-icon class="warning" [inline]="true">warning</mat-icon> {{ job?.numberOfWarnings }}</span
          >
        }
        @if (job?.numberOfFindings) {
          <span class="summary"
            ><mat-icon class="finding" [inline]="true">lightbulb_circle</mat-icon> {{ job?.numberOfFindings }}</span
            >
          }`,
})
export class JobStatus {}
