import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { concatMap, map, Observable, scan } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { JobsSocketioClient } from '../../../api/jobs/jobs/jobs.socketio-client';
import { getLogTimestamp } from '../../../utils/time.utils';
import { CodeEditorComponent, CodeEditorTheme } from '../../widget/code-editor/code-editor.component';

@Component({
  standalone: true,
  selector: 'app-job-logs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CodeEditorComponent],
  styles: ['app-code-editor { width: 100%; height:100% }'],
  template: `<app-code-editor
    [code]="logs$ | async"
    [language]="'stalker-logs'"
    [minimapEnabled]="false"
    [theme]="theme"
    [readonly]="true"
    fxFlex
  ></app-code-editor>`,
})
export class JobLogsComponent implements OnChanges {
  @Input() public theme: CodeEditorTheme = 'vs-dark';
  @Input() public jobId: string | null | undefined = undefined;

  private socket = new JobsSocketioClient(this.authService);

  public logs$: Observable<string> | null = null;

  constructor(public jobsService: JobsService, public authService: AuthService) {}

  ngOnChanges(): void {
    if (this.jobId != null) {
      this.logs$ = this.jobsService.getJobLogs(this.jobId).pipe(
        map((initialLogs) =>
          initialLogs.items.reduce((acc, value) => acc + this.formatLog(value.timestamp, value.level, value.value), '')
        ),
        concatMap((initialLogs) =>
          this.socket.jobOutput.pipe(
            scan((acc, value) => {
              return acc + this.formatLog(value.timestamp, value.level, value.value);
            }, initialLogs)
          )
        )
      );

      this.socket.sendMessage({ jobId: this.jobId });
    }
  }

  private formatLog(timestamp: number, level: string, log: string): string {
    level = `[${level}]`.padEnd('[warning]'.length, ' ');
    return `${getLogTimestamp(timestamp)} ${level} ${log}\n`;
  }
}
