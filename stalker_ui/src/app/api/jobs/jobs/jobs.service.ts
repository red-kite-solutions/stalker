import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { JobParameter } from '../../../shared/types/finding-event-subscription';
import { JobInput, StartedJob } from '../../../shared/types/jobs/job.type';

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(private http: HttpClient) {}

  public getJobs(): Observable<JobInput[]> {
    return <Observable<Array<JobInput>>>this.http.get(`${environment.fmUrl}/jobs/summaries`);
  }

  public async startJob(jobName: string, jobParameters: JobParameter[], companyId = '') {
    const data = {
      task: jobName,
      jobParameters: jobParameters,
    };
    if (companyId) {
      return <StartedJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/company/${companyId}/job`, data));
    } else {
      return <StartedJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/jobs/`, data));
    }
  }
}
