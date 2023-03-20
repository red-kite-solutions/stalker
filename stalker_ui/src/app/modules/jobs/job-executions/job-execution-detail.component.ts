import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';

@Component({
  selector: 'app-job-execution-detail',
  templateUrl: 'job-execution-detail.component.html',
})
export class JobExecutionDetailComponent {
  public executionId$ = this.route.paramMap.pipe(map((x) => x.get('id')));

  // TODO: Get only the required job
  public execution$ = this.executionId$.pipe(
    switchMap((id) => this.jobService.getJobExecutions(1, 100, {}).pipe(map((jobs) => jobs.items[0])))
  );
  constructor(private jobService: JobsService, private route: ActivatedRoute) {}
}
