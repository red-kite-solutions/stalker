import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { Job } from '../../../shared/types/jobs/job.type';

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(private http: HttpClient) {}

  public getJobs(): Observable<Job[]> {
    // return <Observable<Array<CustomJob>>>this.http.get(`${environment.fmUrl}/custom-jobs/`);
    return from([
      [
        {
          name: 'firstjob',
          parameters: [
            { name: 'paramName', type: 'string' },
            { name: 'paramName2', type: 'string' },
          ],
        },
        {
          name: 'secondjob',
          parameters: [
            { name: 'paramName', type: 'string' },
            { name: 'paramName2', type: 'string' },
          ],
        },
        {
          name: 'thirdjob',
          parameters: [
            { name: 'paramName', type: 'string' },
            { name: 'paramName2', type: 'string' },
          ],
        },
      ],
    ]);
  }
}
