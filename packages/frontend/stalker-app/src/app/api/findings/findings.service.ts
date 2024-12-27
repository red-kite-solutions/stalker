import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomFinding } from '../../shared/types/finding/finding.type';
import { FindingsFilter } from '../../shared/types/finding/findings-filter.type';
import { Page } from '../../shared/types/page.type';

@Injectable({
  providedIn: 'root',
})
export class FindingsService {
  constructor(private http: HttpClient) {}

  public getPage(
    page = 0,
    pageSize = 25,
    filters: FindingsFilter | undefined = undefined
  ): Observable<Page<CustomFinding>> {
    let url = `${environment.fmUrl}/findings?page=${page}&pageSize=${pageSize}`;

    if (filters) {
      const filterString = this.buildFilters(filters);
      if (filterString) url += '&' + filterString;
    }

    return this.http
      .get<Page<CustomFinding>>(url)
      .pipe(tap((x) => (x.items = x.items.map((i) => ({ ...i, created: new Date(i.created) })))));
  }

  public getLatestWebsiteEndpoint(target: string, endpoint: string): Observable<CustomFinding> {
    return this.getPage(0, 1, {
      target: target,
      findingAllowList: ['WebsitePathFinding'],
      fieldFilters: [{ key: 'endpoint', data: endpoint }],
    }).pipe(map((x) => x.items[0]));
  }

  public getLatestWebsitePreview(target: string): Observable<CustomFinding> {
    return this.getPage(0, 1, {
      target: target,
      findingAllowList: ['WebsiteScreenshotFinding'],
    }).pipe(map((x) => x.items[0]));
  }

  private buildFilters(filters: FindingsFilter) {
    let filterParams: string[] = [];

    if (filters.target) {
      filterParams.push(`target=${encodeURIComponent(filters.target)}`);
    }

    if (filters.findingDenyList) {
      for (const f of filters.findingDenyList) filterParams.push(`findingDenyList[]=${encodeURIComponent(f)}`);
    }

    if (filters.findingAllowList) {
      for (const f of filters.findingAllowList) filterParams.push(`findingAllowList[]=${encodeURIComponent(f)}`);
    }

    if (filters.fieldFilters) {
      for (const ff of filters.fieldFilters) {
        filterParams.push(`fieldFilters[]=${encodeURIComponent(JSON.stringify(ff))}`);
      }
    }

    return filterParams.join('&');
  }
}
