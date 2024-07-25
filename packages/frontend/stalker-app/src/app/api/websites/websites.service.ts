import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { Observable, firstValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Page } from '../../shared/types/page.type';
import { Website } from '../../shared/types/websites/website.type';
import { filtersToParams } from '../../utils/filters-to-params';

@Injectable({
  providedIn: 'root',
})
export class WebsitesService {
  constructor(private http: HttpClient) {}

  public getPage(
    page: number,
    pageSize: number,
    filters: any = undefined,
    firstSeenDateRange: DateRange<Date> = new DateRange<Date>(null, null)
  ): Observable<Page<Website>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);

    if (firstSeenDateRange.start) params = params.append('firstSeenStartDate', firstSeenDateRange.start.getTime());
    if (firstSeenDateRange.end) params = params.append('firstSeenEndDate', firstSeenDateRange.end.getTime());

    return this.http.get<Page<Omit<Website, 'url'>>>(`${environment.fmUrl}/websites`, { params }).pipe(
      map((page: Page<Omit<Website, 'url'>>) => {
        const websitePage: Page<Website> = {
          totalRecords: page.totalRecords,
          items: [],
        };

        for (const website of page.items) {
          websitePage.items.push({
            url: this.buildUrl(
              website.domain ? website.domain.name : '',
              website.host.ip,
              website.port.port,
              website.path,
              website.ssl
            ),
            ...website,
          });
        }

        return websitePage;
      })
    );
  }

  public async tagWebsite(websiteId: string, tagId: string, isTagged: boolean) {
    return await firstValueFrom(
      this.http.put(`${environment.fmUrl}/websites/${websiteId}/tags`, { tagId: tagId, isTagged: isTagged })
    );
  }

  public getWebsite(websiteId: string): Observable<Website> {
    return (<Observable<Omit<Website, 'url'>>>this.http.get(`${environment.fmUrl}/websites/${websiteId}`)).pipe(
      map((website) => {
        return {
          url: this.buildUrl(
            website.domain ? website.domain.name : '',
            website.host.ip,
            website.port.port,
            website.path,
            website.ssl
          ),
          ...website,
        };
      })
    );
  }

  public async delete(websiteId: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/websites/${websiteId}`));
  }

  public async deleteMany(websiteIds: string[]) {
    return await firstValueFrom(
      this.http.delete(`${environment.fmUrl}/websites/`, { body: { websiteIds: websiteIds } })
    );
  }

  public async block(websiteIds: string[], block: boolean) {
    return await firstValueFrom(this.http.patch(`${environment.fmUrl}/websites/`, { websiteIds: websiteIds, block }));
  }

  public buildUrl(domain: string, ip: string, port: number, path: string, ssl: boolean): string {
    let url = ssl ? 'https://' : 'http://';
    url += domain ? domain : ip;
    url += port === 80 || port === 443 ? '' : ':' + port.toString();
    url += path;
    return url;
  }
}
