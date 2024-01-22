import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StartedJobState } from '../../../shared/types/jobs/job.type';

@Component({
  standalone: true,
  selector: 'app-job-state',
  styleUrls: ['./job-execution-state.component.scss'],
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `<div class="tw-flex tw-items-center">
    @switch (state) {
      @case ('in-progress') {
        <mat-spinner diameter="16"></mat-spinner>
      }
      @case ('done') {
        <mat-icon class="material-symbols-outlined done" [inline]="true">check_circle</mat-icon>
      }
      @case ('errored') {
        <mat-icon class="material-symbols-outlined error" [inline]="true">error</mat-icon>
      }
    }
  </div>`,
})
export class JobStateComponent {
  @Input() state: StartedJobState | undefined;
}
