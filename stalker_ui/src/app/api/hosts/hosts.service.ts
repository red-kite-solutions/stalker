import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Host } from 'src/app/shared/types/host/host.interface';
import { Page } from 'src/app/shared/types/page.type';
import { environment } from 'src/environments/environment';

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

  private filtersToURL(filters: any) {
    const keys = Object.keys(filters);
    let encodedFilters = new HttpParams();
    for (const key of keys) {
      if (Array.isArray(filters[key])) {
        for (const value of filters[key]) {
          encodedFilters = encodedFilters.append(`${key}[]`, value);
        }
      } else {
        encodedFilters = encodedFilters.set(key, filters[key]);
      }
    }
    return encodedFilters.toString();
  }

  public getPage(page: number, pageSize: number, filters: any): Observable<Page<Host>> {
    let encodedFilters = this.filtersToURL(filters);
    encodedFilters = encodedFilters ? `&${encodedFilters}` : encodedFilters;
    return <Observable<Page<Host>>>(
      this.http.get(`${environment.fmUrl}/hosts?page=${page}&pageSize=${pageSize}${encodedFilters}`)
    );
  }

  public async toggleHostTag(hostId: string, tagId: string) {
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/hosts/${hostId}/tags`, { tagId: tagId }));
  }
}
