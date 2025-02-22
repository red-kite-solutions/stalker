import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IpRange } from '../../shared/types/ip-range/ip-range.interface';
import { Page } from '../../shared/types/page.type';
import { filtersToParams } from '../../utils/filters-to-params';

@Injectable({
  providedIn: 'root',
})
export class IpRangesService {
  constructor(private http: HttpClient) {}
  private readonly route = `${environment.fmUrl}/ip-ranges`;

  public get(id: string): Observable<IpRange> {
    return <Observable<IpRange>>this.http.get(`${this.route}/${id}`);
  }

  public getPage(
    page: number,
    pageSize: number,
    filters: any = undefined,
    firstSeenDateRange: DateRange<Date> = new DateRange<Date>(null, null)
  ): Observable<Page<IpRange>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    if (firstSeenDateRange.start) params = params.append('firstSeenStartDate', firstSeenDateRange.start.getTime());
    if (firstSeenDateRange.end) params = params.append('firstSeenEndDate', firstSeenDateRange.end.getTime());
    return this.http.get<Page<IpRange>>(`${this.route}`, { params });
  }

  public async tag(id: string, tagId: string, isTagged: boolean) {
    return await firstValueFrom(this.http.put(`${this.route}/${id}/tags`, { tagId: tagId, isTagged: isTagged }));
  }

  public async add(projectId: string, ranges: Pick<IpRange, 'ip' | 'mask'>[]): Promise<any[]> {
    return await firstValueFrom(this.http.post<any[]>(`${this.route}`, { ranges, projectId }));
  }

  public async delete(hostId: string) {
    return await firstValueFrom(this.http.delete(`${this.route}/${hostId}`));
  }

  public async deleteMany(hostIds: string[]) {
    return await firstValueFrom(this.http.delete(`${this.route}/`, { body: { hostIds: hostIds } }));
  }

  public async block(hostIds: string[], block: boolean) {
    return await firstValueFrom(this.http.patch(`${this.route}/`, { hostIds, block }));
  }
}
