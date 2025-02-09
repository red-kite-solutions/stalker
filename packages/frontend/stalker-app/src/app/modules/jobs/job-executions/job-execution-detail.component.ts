import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, firstValueFrom, map, Observable, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { JobExecutionsService } from '../../../api/jobs/job-executions/job-executions.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { ThemeService } from '../../../services/theme.service';
import { JobLogsComponent } from '../../../shared/components/job-logs/job-logs.component';
import { CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';
import { JobExecutionInteractionsService } from './job-execution-interactions.service';

@Component({
  selector: 'app-job-execution-detail',
  templateUrl: 'job-execution-detail.component.html',
  styleUrls: ['./job-execution-detail.component.scss'],
})
export class JobExecutionDetailComponent implements AfterViewInit {
  public executionId$ = this.route.paramMap.pipe(map((x) => x.get('id')));
  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );
  public execution$ = this.executionId$.pipe(
    switchMap((jobId) => this.jobService.getJobExecution(`${jobId}`)),
    shareReplay(1)
  );

  @ViewChild(JobLogsComponent) public logs!: JobLogsComponent;
  public jobIsStopping$ = new BehaviorSubject<boolean>(false);
  public jobIsRunning$!: Observable<boolean>;

  public projects$ = this.projectsService
    .getAllSummaries()
    .pipe(map((projects: any[]) => projects.map((c) => ({ id: c._id, name: c.name }))));

  public logs$: Observable<string> = new Subject<string>();

  constructor(
    private jobService: JobExecutionsService,
    private projectsService: ProjectsService,
    private route: ActivatedRoute,
    private themeService: ThemeService,
    private jobExecutionInteractionsService: JobExecutionInteractionsService
  ) {}

  ngAfterViewInit(): void {
    this.jobIsRunning$ = this.logs.isJobInProgress$.pipe(
      tap((inProgress) => {
        if (!inProgress) {
          this.jobIsStopping$.next(false);
        }
      })
    );
  }

  public async stopJob() {
    const id = await firstValueFrom(this.executionId$);
    if (!id) return;

    const result = await this.jobExecutionInteractionsService.stopJob(id);

    if (result) {
      this.jobIsStopping$.next(true);
    }
  }
}
