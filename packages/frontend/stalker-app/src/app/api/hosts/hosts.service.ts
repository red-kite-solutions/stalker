import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { Observable, firstValueFrom } from 'rxjs';
import { Host } from 'src/app/shared/types/host/host.interface';
import { Page } from 'src/app/shared/types/page.type';
import { environment } from 'src/environments/environment';
import { filtersToParams } from '../../utils/filters-to-params';

@Injectable({
  providedIn: 'root',
})
export class HostsService {
  constructor(private http: HttpClient) {}

  public get(hostId: string): Observable<Host> {
    return <Observable<Host>>this.http.get(`${environment.fmUrl}/hosts/${hostId}`);
  }

  public getPage(
    page: number,
    pageSize: number,
    filters: any = undefined,
    firstSeenDateRange: DateRange<Date> = new DateRange<Date>(null, null)
  ): Observable<Page<Host>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    if (firstSeenDateRange.start) params = params.append('firstSeenStartDate', firstSeenDateRange.start.getTime());
    if (firstSeenDateRange.end) params = params.append('firstSeenEndDate', firstSeenDateRange.end.getTime());
    return this.http.get<Page<Host>>(`${environment.fmUrl}/hosts`, { params });
  }

  public async tagHost(hostId: string, tagId: string, isTagged: boolean) {
    return await firstValueFrom(
      this.http.put(`${environment.fmUrl}/hosts/${hostId}/tags`, { tagId: tagId, isTagged: isTagged })
    );
  }

  public async addHosts(projectId: string, ips: string[]): Promise<any[]> {
    return await firstValueFrom(this.http.post<any[]>(`${environment.fmUrl}/hosts`, { ips, projectId: projectId }));
  }

  public async delete(hostId: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/hosts/${hostId}`));
  }

  public async deleteMany(hostIds: string[]) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/hosts/`, { body: { hostIds: hostIds } }));
  }
}
