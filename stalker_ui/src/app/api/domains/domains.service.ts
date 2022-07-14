import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { fmUrl } from '../constants';

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
    return this.http.get(`${fmUrl}/domains?page=${page}&pageSize=${pageSize}${encodedFilters}`) as Observable<Domain[]>;
  }

  public getCount(filters: any = {}) {
    let encodedFilters = this.filtersToURL(filters);
    let urlParams = '';
    if (encodedFilters) {
      encodedFilters = encodedFilters.substring(1); // removing the fisrt &
      urlParams = `?${encodedFilters}`;
    }
    return this.http.get(`${fmUrl}/domains/count${urlParams}`).pipe(
      map((v: any) => {
        return v.count;
      })
    ) as Observable<number>;
  }
}
