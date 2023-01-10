import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CustomJob, CustomJobData } from '../../../shared/types/custom-job';

@Injectable({
  providedIn: 'root',
})
export class CustomJobsService {
  constructor(private http: HttpClient) {}

  public getCustomJobs(): Observable<CustomJob[]> {
    // return <Observable<Array<CustomJob>>>this.http.get(`${environment.fmUrl}/custom-jobs/`);
    return from(
      Array([
        {
          _id: 'asdf',
          name: 'my first job',
          type: 'code',
          code: 'qwerty\nasdf\nzxcv',
          language: 'python',
        },
        {
          _id: 'asdf2',
          name: 'my second job',
          type: 'code',
          code: 'qwerty\n\nuiop',
          language: 'python',
        },
      ])
    );
  }

  public async create(data: CustomJobData): Promise<CustomJob> {
    return <CustomJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/custom-jobs/`, data));
  }

  public async edit(id: string, data: CustomJobData) {
    return await firstValueFrom(this.http.post(`${environment.fmUrl}/custom-jobs/${id}`, data));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/custom-jobs/${id}`));
  }
}
