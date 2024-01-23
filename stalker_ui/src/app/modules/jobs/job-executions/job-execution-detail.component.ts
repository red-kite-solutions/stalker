import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, shareReplay, Subject, switchMap } from 'rxjs';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';

@Component({
  selector: 'app-job-execution-detail',
  templateUrl: 'job-execution-detail.component.html',
  styleUrls: ['./job-execution-detail.component.scss'],
})
export class JobExecutionDetailComponent {
  public executionId$ = this.route.paramMap.pipe(map((x) => x.get('id')));
  public theme: CodeEditorTheme = 'vs-dark';

  public execution$ = this.executionId$.pipe(
    switchMap((jobId) => this.jobService.getJobExecution(`${jobId}`)),
    shareReplay(1)
  );

  public projects$ = this.projectsService
    .getAllSummaries()
    .pipe(map((projects: any[]) => projects.map((c) => ({ id: c._id, name: c.name }))));

  public logs$: Observable<string> = new Subject<string>();

  constructor(
    private jobService: JobsService,
    private projectsService: ProjectsService,
    private route: ActivatedRoute
  ) {}
}
