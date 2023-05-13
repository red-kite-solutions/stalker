import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { Page } from 'src/app/shared/types/page.type';
import { environment } from 'src/environments/environment';
import { filtersToParams } from '../../utils/filters-to-params';

@Injectable({
  providedIn: 'root',
})
export class DomainsService {
  constructor(private http: HttpClient) {}

  public getPage(page: number, pageSize: number, filters: any): Observable<Page<Domain>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);

    return this.http.get<Page<Domain>>(`${environment.fmUrl}/domains`, { params });
  }

  public async addDomains(companyId: string, newDomains: string[]): Promise<any[]> {
    return await firstValueFrom(
      this.http.post<any[]>(`${environment.fmUrl}/company/${companyId}/domain`, { domains: newDomains })
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
}
