import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CustomJob, CustomJobData } from '../../../shared/types/jobs/custom-job.type';
import { Page } from '../../../shared/types/page.type';
import { normalizeSearchString } from '../../../utils/normalize-search-string';

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(private http: HttpClient) {}

  private format(data: CustomJobData): Omit<CustomJobData, 'container'> & { containerId: string } {
    const job = {
      containerId: data.container.id,
      ...data,
      container: undefined,
    };
    return job;
  }

  public getCustomJobs(filters: string[], page: number, pageSize: number): Observable<Page<CustomJob>> {
    return this.http.get<CustomJob[]>(`${environment.fmUrl}/custom-jobs/`).pipe(
      map((jobs) => jobs.sort((a, b) => a._id.localeCompare(b._id))),
      map((jobs) => jobs.filter((job) => !filters?.length || this.filterJob(job, filters))),
      map((jobs) => ({ items: jobs.slice(page * pageSize, page * pageSize + pageSize), totalRecords: jobs.length }))
    );
  }

  public get(id: string): Observable<CustomJob> {
    return <Observable<CustomJob>>this.http.get(`${environment.fmUrl}/custom-jobs/${id}`).pipe(
      map((v) => {
        return v;
      })
    );
  }

  public async create(data: CustomJobData): Promise<CustomJob> {
    return <CustomJob>await firstValueFrom(this.http.post(`${environment.fmUrl}/custom-jobs/`, data));
  }

  public async edit(id: string, data: CustomJobData) {
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/custom-jobs/${id}`, this.format(data)));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/custom-jobs/${id}`));
  }

  public async duplicate(id: string) {
    return await firstValueFrom(this.http.post(`${environment.fmUrl}/custom-jobs`, { jobId: id }));
  }

  public async syncCache() {
    return await firstValueFrom(this.http.post(`${environment.fmUrl}/custom-jobs/sync`, undefined));
  }

  private filterJob(job: CustomJob, filters: string[]) {
    const parts = [job.name, job.findingHandlerLanguage, job.type];
    return filters.some((filter) => normalizeSearchString(parts.join(' ')).includes(filter));
  }
}
