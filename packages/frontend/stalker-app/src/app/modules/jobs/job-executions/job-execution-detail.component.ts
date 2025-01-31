import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, shareReplay, Subject, switchMap } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { JobExecutionsService } from '../../../api/jobs/job-executions/job-executions.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';

@Component({
  selector: 'app-job-execution-detail',
  templateUrl: 'job-execution-detail.component.html',
  styleUrls: ['./job-execution-detail.component.scss'],
})
export class JobExecutionDetailComponent {
  public executionId$ = this.route.paramMap.pipe(map((x) => x.get('id')));
  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );
  public execution$ = this.executionId$.pipe(
    switchMap((jobId) => this.jobService.getJobExecution(`${jobId}`)),
    shareReplay(1)
  );

  public projects$ = this.projectsService
    .getAllSummaries()
    .pipe(map((projects: any[]) => projects.map((c) => ({ id: c._id, name: c.name }))));

  public logs$: Observable<string> = new Subject<string>();

  constructor(
    private jobService: JobExecutionsService,
    private projectsService: ProjectsService,
    private route: ActivatedRoute,
    private themeService: ThemeService
  ) {}
}
