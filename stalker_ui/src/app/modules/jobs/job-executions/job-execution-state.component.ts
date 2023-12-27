import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { StartedJobState } from '../../../shared/types/jobs/job.type';

@Component({
  standalone: true,
  selector: 'app-job-state',
  styleUrls: ['./job-execution-state.component.scss'],
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
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
