import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CustomJob, CustomJobData } from '../../../shared/types/jobs/custom-job.type';

@Injectable({
  providedIn: 'root',
})
export class CustomJobsService {
  constructor(private http: HttpClient) {}

  private format(data: CustomJobData): Omit<CustomJobData, 'container'> & { containerId: string } {
    const job = {
      containerId: data.container.id,
      ...data,
      container: undefined,
    };
    return job;
  }

  public getCustomJobs(): Observable<CustomJob[]> {
    return <Observable<CustomJob[]>>this.http.get(`${environment.fmUrl}/custom-jobs/`);
  }

  public get(id: string): Observable<CustomJob> {
    return <Observable<CustomJob>>this.http.get(`${environment.fmUrl}/custom-jobs/${id}`).pipe(
      map((v) => {
        return v;
      })
    );
  }

  public async create(data: CustomJobData): Promise<CustomJob> {
    return <CustomJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/custom-jobs/`, this.format(data)));
  }

  public async edit(id: string, data: CustomJobData) {
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/custom-jobs/${id}`, this.format(data)));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/custom-jobs/${id}`));
  }

  public async syncCache() {
    return await firstValueFrom(this.http.post(`${environment.fmUrl}/custom-jobs/sync`, undefined));
  }
}
