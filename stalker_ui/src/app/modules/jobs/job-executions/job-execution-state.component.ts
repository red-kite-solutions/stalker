import { Component, Input } from '@angular/core';
import { StartedJobState } from '../../../shared/types/jobs/job.type';

@Component({
  selector: 'app-job-state',
  styleUrls: ['./job-execution-state.component.scss'],
  template: `<div [ngSwitch]="state">
    <ng-container *ngSwitchCase="'in-progress'"><mat-spinner diameter="16"></mat-spinner></ng-container>
    <ng-container *ngSwitchCase="'done'">
      <mat-icon class="done" [inline]="true">check_circle</mat-icon>
    </ng-container>
    <ng-container *ngSwitchCase="'errored'">
      <mat-icon class="error" [inline]="true">error</mat-icon>
    </ng-container>
  </div>`,
})
export class JobStateComponent {
  @Input() state: StartedJobState | undefined;
}
