import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Page } from '../../shared/types/page.type';
import { Port, PortNumber } from '../../shared/types/ports/port.interface';
import { filtersToParams } from '../../utils/filters-to-params';

@Injectable({
  providedIn: 'root',
})
export class PortsService {
  constructor(private http: HttpClient) {}

  public getPorts(
    hostId: string,
    page: number,
    pageSize: number,
    options: {
      protocol?: 'tcp' | 'udp' | null;
      detailsLevel?: 'full' | 'summary' | 'number' | null;
      sortType?: 'popularity' | 'port' | null;
      sortOrder?: 'ascending' | 'descending' | null;
    } | null = null
  ): Observable<PortNumber[]> {
    let params = new HttpParams();
    if (options) {
      if (options.protocol) params = params.set('protocol', options.protocol);
      if (options.detailsLevel) params = params.set('detailsLevel', options.detailsLevel);
      if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);
      if (options.sortType) params = params.set('sortType', options.sortType);
    }
    params = params.set('hostId', hostId);
    params = params.set('page', page);
    params = params.set('pageSize', pageSize);

    return <Observable<PortNumber[]>>this.http.get(`${environment.fmUrl}/ports/?${params.toString()}`);
  }

  public getPage(
    page: number,
    pageSize: number,
    filters: any = undefined,
    firstSeenDateRange: DateRange<Date> = new DateRange<Date>(null, null)
  ) {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    if (firstSeenDateRange.start) params = params.append('firstSeenStartDate', firstSeenDateRange.start.getTime());
    if (firstSeenDateRange.end) params = params.append('firstSeenEndDate', firstSeenDateRange.end.getTime());
    return this.http.get<Page<Port>>(`${environment.fmUrl}/ports`, { params });
  }

  public async tagPort(portId: string, tagId: string, isTagged: boolean) {
    return await firstValueFrom(
      this.http.put(`${environment.fmUrl}/ports/${portId}/tags`, { tagId: tagId, isTagged: isTagged })
    );
  }

  public getPort(portId: string) {
    return <Observable<Port>>this.http.get(`${environment.fmUrl}/ports/${portId}`);
  }

  public async delete(portId: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/ports/${portId}`));
  }

  public async deleteMany(portIds: string[]) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/ports/`, { body: { portIds: portIds } }));
  }
}
