import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../../shared/types/page.type';
import { ExtendedPort, Port, PortNumber } from '../../shared/types/ports/port.interface';
import { filtersToParams } from '../../utils/filters-to-params';

@Injectable({
  providedIn: 'root',
})
export class PortsService {
  constructor(private http: HttpClient) {}

  public getPage<T extends Port | PortNumber | ExtendedPort>(
    page: number,
    pageSize: number,
    filters: any = undefined,
    firstSeenDateRange: DateRange<Date> = new DateRange<Date>(null, null),
    detailsLevel: 'extended' | 'full' | 'summary' | 'number' = 'full'
  ): Observable<Page<T>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);

    params = params.append('detailsLevel', detailsLevel);
    if (firstSeenDateRange.start) params = params.append('firstSeenStartDate', firstSeenDateRange.start.getTime());
    if (firstSeenDateRange.end) params = params.append('firstSeenEndDate', firstSeenDateRange.end.getTime());

    return this.http.get<Page<T>>(`${environment.fmUrl}/ports`, { params });
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

  public async block(portIds: string[], block: boolean) {
    return await firstValueFrom(this.http.patch(`${environment.fmUrl}/ports/`, { portIds, block }));
  }
}
