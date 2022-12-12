import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Host } from 'src/app/shared/types/host/host.interface';
import { Page } from 'src/app/shared/types/page.type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HostsService {
  constructor(private http: HttpClient) {}

  public get(hostId: string): Observable<Host> {
    // return <Observable<Host>>this.http.get(`${environment.fmUrl}/hosts/${hostId}`);
    return of({
      _id: hostId,
      companyId: '637a4c8d3e6a000046f7b3da',
      domains: [
        {
          id: '637a4cb53e6a000046f7b3e7',
          name: 'amazon.com',
        },
      ],
      ip: '13.225.195.52',
      notes: '',
      ports: [
        {
          id: '1',
          port: 80,
          findingsCorrelationKey: '123',
        },
        {
          id: '2',
          port: 443,
          findingsCorrelationKey: '1234',
        },
      ],
      tags: [],
    } as Host);
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
}
