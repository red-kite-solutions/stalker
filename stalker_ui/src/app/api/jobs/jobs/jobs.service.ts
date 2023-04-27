import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { JobParameter } from '../../../shared/types/finding-event-subscription';
import { JobListEntry, StartedJob, StartedJobState, StartedJobViewModel } from '../../../shared/types/jobs/job.type';
import { Page } from '../../../shared/types/page.type';
import { filtersToParams } from '../../../utils/filters-to-params';
import { JobOutputResponse } from './jobs.socketio-client';

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(private http: HttpClient) {}

  public getJobSummaries(): Observable<JobListEntry[]> {
    return <Observable<Array<JobListEntry>>>this.http.get(`${environment.fmUrl}/jobs/summaries`);
  }

  public getJobExecutions(page: number, pageSize: number, filters: any): Observable<Page<StartedJobViewModel>> {
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
      numberOfWarnings: logsPerLevel.warning,
      numberOfErrors: logsPerLevel.error,
      numberOfFindings: logsPerLevel.finding,
      state: this.toStartedJobState(job),
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

  public async startJob(jobName: string, source: string, jobParameters: JobParameter[], companyId = '') {
    const data = {
      task: jobName,
      source: source,
      jobParameters: jobParameters,
    };
    if (companyId) {
      return <StartedJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/company/${companyId}/job`, data));
    } else {
      return <StartedJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/jobs/`, data));
    }
  }
}
