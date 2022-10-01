import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DomainsService {
  constructor(private http: HttpClient) {}

  private filtersToURL(filters: any) {
    const keys = Object.keys(filters);
    let encodedFilters = '';
    for (const key of keys) {
      if (Array.isArray(filters[key])) {
        for (const value of filters[key]) {
          const encodedValue = encodeURI(value);
          encodedFilters += `&${key}[]=${encodedValue}`;
        }
      } else {
        encodedFilters = `&${key}=` + encodeURI(filters[key]);
      }
    }
    return encodedFilters;
  }

  public getPage(page: number, pageSize: number, filters: any): Observable<Domain[]> {
    const encodedFilters = this.filtersToURL(filters);
    return <Observable<Domain[]>>(
      this.http.get(`${environment.fmUrl}/domains?page=${page}&pageSize=${pageSize}${encodedFilters}`)
    );
  }

  public getCount(filters: any = {}) {
    let encodedFilters = this.filtersToURL(filters);
    let urlParams = '';
    if (encodedFilters) {
      encodedFilters = encodedFilters.substring(1); // removing the first &
      urlParams = `?${encodedFilters}`;
    }
    return <Observable<number>>this.http.get(`${environment.fmUrl}/domains/count${urlParams}`).pipe(
      map((v: any) => {
        return v.count;
      })
    );
  }

  public async addDomains(companyId: string, newDomains: string[]): Promise<any[]> {
    return await firstValueFrom(
      this.http.post<any[]>(`${environment.fmUrl}/company/${companyId}/domain`, { domains: newDomains })
    );
  }
}
