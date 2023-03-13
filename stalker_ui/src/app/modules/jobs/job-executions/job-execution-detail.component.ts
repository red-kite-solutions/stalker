import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-job-execution-detail',
  templateUrl: 'job-execution-detail.component.html',
})
export class JobExecutionDetailComponent {
  public executionId$ = this.route.paramMap.pipe(map((x) => x.get('id')));

  constructor(public route: ActivatedRoute) {}
}
