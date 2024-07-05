import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomFinding } from '../../shared/types/finding/finding.type';
import { Page } from '../../shared/types/page.type';

@Injectable({
  providedIn: 'root',
})
export class FindingsService {
  constructor(private http: HttpClient) {}

  public getFindings(
    target: string | undefined = undefined,
    page = 1,
    pageSize = 25,
    filterFindingKeys: string[]
  ): Observable<Page<CustomFinding>> {
    let url = `${environment.fmUrl}/findings?target=${target}&page=${page}&pageSize=${pageSize}`;
    for (let f of filterFindingKeys) {
      url += `&filterFinding[]=${encodeURIComponent(f)}`;
    }

    return this.http
      .get<Page<CustomFinding>>(url)
      .pipe(tap((x) => (x.items = x.items.map((i) => ({ ...i, created: new Date(i.created) })))));
  }

  public getLatestWebsiteEndpoint(target: string, endpoint: string): Observable<CustomFinding> {
    return this.http
      .get<CustomFinding>(
        `${environment.fmUrl}/findings/endpoint?target=${target}&endpoint=${encodeURIComponent(endpoint)}`
      )
      .pipe(
        map((x) => {
          return { ...x, created: new Date(x.created) };
        })
      );
  }
}
