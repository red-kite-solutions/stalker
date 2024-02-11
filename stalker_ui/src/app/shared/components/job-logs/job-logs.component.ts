import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable, concatMap, debounceTime, map, scan, shareReplay, startWith } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { JobsSocketioClient } from '../../../api/jobs/jobs/jobs.socketio-client';
import { getLogTimestamp } from '../../../utils/time.utils';
import { CodeEditorComponent, CodeEditorTheme } from '../../widget/code-editor/code-editor.component';

@Component({
  standalone: true,
  selector: 'app-job-logs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CodeEditorComponent, MatProgressBarModule],
  styles: ['app-code-editor { width: 100%; height:100%; border-radius: 0; }'],
  template: ` <mat-progress-bar
      mode="indeterminate"
      [ngStyle]="{ display: (isJobInProgress$ | async) ? 'block' : 'none' }"
    ></mat-progress-bar
    ><app-code-editor
      [code]="logs$ | async"
      [language]="'stalker-logs'"
      [minimapEnabled]="false"
      [theme]="theme"
      [readonly]="true"
      class="tw-flex-1"
      [path]="'/job-logs/job.log'"
    ></app-code-editor>`,
})
export class JobLogsComponent implements OnChanges {
  @Input() public theme: CodeEditorTheme = 'vs-dark';
  @Input() public jobId: string | null | undefined = undefined;

  private socket: JobsSocketioClient | undefined = undefined;

  public logs$: Observable<string> | null = null;
  public isJobInProgress$: Observable<boolean> | null = null;

  constructor(
    public jobsService: JobsService,
    public authService: AuthService
  ) {}

  ngOnChanges(): void {
    if (this.jobId != null) {
      this.socket?.disconnect();
      this.socket = new JobsSocketioClient(this.authService);
      this.logs$ = this.jobsService.getJobLogs(this.jobId).pipe(
        map((initialLogs) =>
          initialLogs.items.map((value) => this.formatLog(value.timestamp, value.level, value.value))
        ),
        concatMap((initialLogs) =>
          this.socket!.jobOutput.pipe(
            startWith(null),
            scan((acc, value) => {
              console.log(value);
              if (value == null) return acc;

              return acc.concat(this.formatLog(value.timestamp, value.level, value.value));
            }, initialLogs)
          )
        ),
        map((logs) => {
          const result = logs.sort((a, b) => a.timestamp - b.timestamp).reduce((acc, x) => acc + x.log + '\n', '');
          console.log(result);
          return result;
        }),
        debounceTime(100), // Prevents furious redrawing
        shareReplay(1)
      );

      this.isJobInProgress$ = this.socket.jobStatus.pipe(
        map((update) => {
          switch (update.status) {
            case 'success':
              setTimeout(() => this.socket?.disconnect(), 5000);
              return false;

            case 'started':
            default:
              return true;
          }
        })
      );

      this.socket.sendMessage({ jobId: this.jobId || '' });
    }
  }

  private formatLog(timestamp: number, level: string, log: string): { timestamp: number; log: string } {
    level = `[${level}]`.padEnd('[warning]'.length, ' ');
    return { timestamp, log: `${getLogTimestamp(timestamp)} ${level} ${log}` };
  }
}
