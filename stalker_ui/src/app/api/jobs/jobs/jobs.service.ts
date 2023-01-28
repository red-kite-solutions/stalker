import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Job } from '../../../shared/types/jobs/job.type';

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(private http: HttpClient) {}

  public getJobs(): Observable<Job[]> {
    return <Observable<Array<Job>>>this.http.get(`${environment.fmUrl}/jobs/summaries`);
  }
}
