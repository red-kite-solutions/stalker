import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, shareReplay, Subject, switchMap } from 'rxjs';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';

@Component({
  selector: 'app-job-execution-detail',
  templateUrl: 'job-execution-detail.component.html',
  styleUrls: ['./job-execution-detail.component.scss'],
})
export class JobExecutionDetailComponent {
  public executionId$ = this.route.paramMap.pipe(map((x) => x.get('id')));
  public theme: CodeEditorTheme = 'vs-dark';

  // TODO: Get only the required job
  public execution$ = this.executionId$.pipe(
    switchMap((_) => this.jobService.getJobExecutions(1, 100, {}).pipe(map((jobs) => jobs.items[0]))),
    shareReplay(1)
  );

  public companies$ = this.companiesService
    .getAllSummaries()
    .pipe(map((companies: any[]) => companies.map((c) => ({ id: c._id, name: c.name }))));

  public logs$: Observable<string> = new Subject<string>();

  constructor(
    private jobService: JobsService,
    private companiesService: CompaniesService,
    private route: ActivatedRoute
  ) {}
}
