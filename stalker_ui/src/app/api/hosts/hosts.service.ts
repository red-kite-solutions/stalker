import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  ): Observable<number[]> {
    let params = new HttpParams();
    if (options) {
      if (options.protocol) params = params.set('protocol', options.protocol);
      if (options.detailsLevel) params = params.set('detailsLevel', options.detailsLevel);
      if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);
      if (options.sortType) params = params.set('sortType', options.sortType);
    }
    params = params.set('page', page);
    params = params.set('pageSize', pageSize);

    return <Observable<number[]>>this.http.get(`${environment.fmUrl}/hosts/${hostId}/ports?${params.toString()}`);
  }

  public getPage(page: number, pageSize: number, filters: any): Observable<Page<Host>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    return this.http.get<Page<Host>>(`${environment.fmUrl}/hosts`, { params });
  }
}
