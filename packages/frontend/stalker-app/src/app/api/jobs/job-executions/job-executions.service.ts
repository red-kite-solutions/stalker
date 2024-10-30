import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { JobListEntry, StartedJob, StartedJobState, StartedJobViewModel } from '../../../shared/types/jobs/job.type';
import { Page } from '../../../shared/types/page.type';
import { JobParameter } from '../../../shared/types/subscriptions/subscription.type';
import { filtersToParams } from '../../../utils/filters-to-params';
import { JobOutputResponse } from './job-executions.socketio-client';

@Injectable({
  providedIn: 'root',
})
export class JobExecutionsService {
  constructor(private http: HttpClient) {}

  public getJobSummaries(): Observable<JobListEntry[]> {
    return <Observable<JobListEntry[]>>this.http.get(`${environment.fmUrl}/jobs/summaries`);
  }

  public getJobExecutions(
    page: number,
    pageSize: number,
    filters: any = undefined
  ): Observable<Page<StartedJobViewModel>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);

    return this.http.get<Page<StartedJob>>(`${environment.fmUrl}/jobs`, { params }).pipe(
      map((page) => ({
        totalRecords: page.totalRecords,
        items: page.items.map((i) => this.toStartedJobViewModel(i)),
      }))
    );
  }

  public getJobExecution(jobId: string): Observable<StartedJobViewModel> {
    return this.http
      .get<StartedJob>(`${environment.fmUrl}/jobs/${jobId}`)
      .pipe(map((model) => this.toStartedJobViewModel(model)));
  }

  public getJobLogs(jobId: string): Observable<Page<JobOutputResponse>> {
    return this.http.get<Page<JobOutputResponse>>(`${environment.fmUrl}/jobs/${jobId}/logs`);
  }

  private toStartedJobViewModel(job: StartedJob): StartedJobViewModel {
    const logsPerLevel = job.output.reduce(
      (prev, current) => {
        prev[current.level] += 1;
        return prev;
      },
      {
        debug: 0,
        info: 0,
        warning: 0,
        error: 0,
        finding: 0,
      }
    );

    return {
      ...job,
      id: job._id,
      numberOfWarnings: logsPerLevel.warning,
      numberOfErrors: logsPerLevel.error,
      numberOfFindings: logsPerLevel.finding,
      state: this.toStartedJobState(job),
      startTimestamp: job.startTime,
      endTimestamp: job.endTime,
      startTime: job.startTime != null ? new Date(job.startTime) : undefined,
      endTime: job.endTime != null ? new Date(job.endTime) : undefined,
    };
  }

  private toStartedJobState(job: StartedJob): StartedJobState | undefined {
    if (job == null) return undefined;

    if (job.endTime == null) {
      return 'in-progress';
    }

    if (job.output.find((x) => x.level === 'error')) return 'errored';

    return 'done';
  }

  public async startJob(jobName: string, jobParameters: JobParameter[], projectId: string | null = null) {
    const data = {
      task: jobName,
      jobParameters: jobParameters,
      projectId: projectId,
    };

    return <StartedJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/jobs/`, data));
  }
}
