import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'job-status',
  template: ` <span class="summary"
      ><mat-icon *ngIf="job?.numberOfErrors" class="error" [inline]="true">error</mat-icon>
      {{ job?.numberOfErrors }}</span
    >
    <span class="summary" *ngIf="job?.numberOfWarnings"
      ><mat-icon class="warning" [inline]="true">warning</mat-icon> {{ job?.numberOfWarnings }}</span
    >
    <span class="summary" *ngIf="job?.numberOfFindings"
      ><mat-icon class="finding" [inline]="true">lightbulb_circle</mat-icon> {{ job?.numberOfFindings }}</span
    >`,
})
export class JobStatus {}
