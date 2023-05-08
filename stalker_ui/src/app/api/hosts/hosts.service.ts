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

  public async tagHost(hostId: string, tagId: string, isTagged: boolean) {
    return await firstValueFrom(
      this.http.put(`${environment.fmUrl}/hosts/${hostId}/tags`, { tagId: tagId, isTagged: isTagged })
    );
  }
}
