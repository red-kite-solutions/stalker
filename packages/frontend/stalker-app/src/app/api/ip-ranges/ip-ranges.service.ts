import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { SearchQueryParser, SearchTerms } from '@red-kite/common/search-query';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IpRange } from '../../shared/types/ip-range/ip-range.interface';
import { Page } from '../../shared/types/page.type';

@Injectable({
  providedIn: 'root',
})
export class IpRangesService {
  private searchParser = new SearchQueryParser();
  private readonly route = `${environment.fmUrl}/ip-ranges`;

  constructor(private http: HttpClient) {}

  public get(id: string): Observable<IpRange> {
    return <Observable<IpRange>>this.http.get(`${this.route}/${id}`);
  }

  public getPage(
    page: number,
    pageSize: number,
    query: string | SearchTerms,
    firstSeenDateRange: DateRange<Date> = new DateRange<Date>(null, null),
    detailsLevel: 'extended' | 'full' | 'summary' = 'extended'
  ): Observable<Page<IpRange>> {
    let params = new HttpParams();
    params = params.append('query', this.searchParser.toQueryString(query));
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    if (firstSeenDateRange.start) params = params.append('firstSeenStartDate', firstSeenDateRange.start.getTime());
    if (firstSeenDateRange.end) params = params.append('firstSeenEndDate', firstSeenDateRange.end.getTime());
    if (detailsLevel) params = params.append('detailsLevel', detailsLevel);
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

  public async deleteMany(ipRangeIds: string[]) {
    return await firstValueFrom(this.http.delete(`${this.route}/`, { body: { ipRangeIds: ipRangeIds } }));
  }

  public async block(ipRangeIds: string[], block: boolean) {
    return await firstValueFrom(this.http.patch(`${this.route}/`, { ipRangeIds: ipRangeIds, block }));
  }
}
