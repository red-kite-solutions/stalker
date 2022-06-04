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

  public getPage(page: number, pageSize: number): Observable<Domain[]> {
    return this.http.get(`${fmUrl}/domains?page=${page}&pageSize=${pageSize}`) as Observable<Domain[]>;
  }

  public getCount() {
    return this.http.get(`${fmUrl}/domains/count`).pipe(
      map((v: any) => {
        return v.count;
      })
    ) as Observable<number>;
  }
}
