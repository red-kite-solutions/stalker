import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../../services/resources/resource.service';
import { Domain } from '../../shared/types/domain/domain.interface';
import { Page } from '../../shared/types/page.type';
import { filtersToParams } from '../../utils/filters-to-params';

@Injectable({
  providedIn: 'root',
})
export class DomainsService implements ResourceService<Domain> {
  constructor(private http: HttpClient) {}

  public getPage(
    page: number,
    pageSize: number,
    filters: any = undefined,
    firstSeenDateRange: DateRange<Date> = new DateRange<Date>(null, null)
  ): Observable<Page<Domain>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    if (firstSeenDateRange.start) params = params.append('firstSeenStartDate', firstSeenDateRange.start.getTime());
    if (firstSeenDateRange.end) params = params.append('firstSeenEndDate', firstSeenDateRange.end.getTime());
    return this.http.get<Page<Domain>>(`${environment.fmUrl}/domains`, { params });
  }

  public async addDomains(projectId: string, newDomains: string[]): Promise<any[]> {
    return await firstValueFrom(
      this.http.post<any[]>(`${environment.fmUrl}/domains`, { domains: newDomains, projectId: projectId })
    );
  }

  public get(domainId: string): Observable<Domain> {
    return <Observable<Domain>>this.http.get(`${environment.fmUrl}/domains/${domainId}`);
  }

  public async tagDomain(domainId: string, tagId: string, isTagged: boolean) {
    return await firstValueFrom(
      this.http.put(`${environment.fmUrl}/domains/${domainId}/tags`, { tagId: tagId, isTagged: isTagged })
    );
  }

  public async delete(domainId: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/domains/${domainId}`));
  }

  public async deleteMany(domainIds: string[]) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/domains/`, { body: { domainIds: domainIds } }));
  }

  public async block(domainIds: string[], block: boolean) {
    return await firstValueFrom(this.http.patch(`${environment.fmUrl}/domains/`, { domainIds, block }));
  }
}
