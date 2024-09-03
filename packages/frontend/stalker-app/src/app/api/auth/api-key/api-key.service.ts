import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Page } from 'src/app/shared/types/page.type';
import { environment } from 'src/environments/environment';
import { ApiKey } from '../../../shared/types/api-key.type';

@Injectable({
  providedIn: 'root',
})
export class ApiKeyService {
  constructor(private http: HttpClient) {}

  public getPage(page: number, pageSize: number, userId: string | undefined = undefined): Observable<Page<ApiKey>> {
    let params = new HttpParams();
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    if (userId) params = params.append('userId', userId);
    return this.http.get<Page<ApiKey>>(`${environment.fmUrl}/api-key`, { params });
  }

  public async createKey(name: string, expiresAt: number): Promise<ApiKey> {
    return await firstValueFrom(this.http.post<ApiKey>(`${environment.fmUrl}/api-key`, { name, expiresAt }));
  }

  public get(apiKeyId: string): Observable<ApiKey> {
    return <Observable<ApiKey>>this.http.get(`${environment.fmUrl}/api-key/${apiKeyId}`);
  }

  public async delete(apiKeyId: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/api-key/${apiKeyId}`));
  }
}
