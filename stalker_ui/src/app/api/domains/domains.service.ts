import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { Page } from 'src/app/shared/types/page.type';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DomainsService {
  constructor(private http: HttpClient) {}

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

  public getPage(page: number, pageSize: number, filters: any): Observable<Page<Domain>> {
    let encodedFilters = this.filtersToURL(filters);
    encodedFilters = encodedFilters ? `&${encodedFilters}` : encodedFilters;
    return <Observable<Page<Domain>>>(
      this.http.get(`${environment.fmUrl}/domains?page=${page}&pageSize=${pageSize}${encodedFilters}`)
    );
  }

  public async addDomains(companyId: string, newDomains: string[]): Promise<any[]> {
    return await firstValueFrom(
      this.http.post<any[]>(`${environment.fmUrl}/company/${companyId}/domain`, { domains: newDomains })
    );
  }

  public get(domainId: string): Observable<Domain> {
    return <Observable<Domain>>this.http.get(`${environment.fmUrl}/domains/${domainId}`);
  }

  public async toggleDomainTag(domainId: string, tagId: string) {
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/domains/${domainId}/tags`, { tagId: tagId }));
  }
}
