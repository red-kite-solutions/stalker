import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, from, map, mergeMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../../shared/types/page.type';
import { ProjectSummary } from '../../shared/types/project/project.summary';
import { Secret } from '../../shared/types/secret.type';
import { normalizeSearchString } from '../../utils/normalize-search-string';

@Injectable({
  providedIn: 'root',
})
export class SecretService {
  constructor(private http: HttpClient) {}

  getSecrets(filters: string[], page: number, pageSize: number, projects: ProjectSummary[]): Observable<Page<Secret>> {
    return this.http.get<Secret[]>(`${environment.fmUrl}/secrets/`).pipe(
      map((secrets) => secrets.sort((a, b) => a._id.localeCompare(b._id))),
      map((secrets) => secrets.filter((secret) => !filters?.length || this.filterSecret(secret, filters, projects))),
      map((secrets) => ({
        items: secrets.slice(page * pageSize, page * pageSize + pageSize),
        totalRecords: secrets.length,
      }))
    );
  }

  async create(secret: Omit<Secret, '_id'>) {
    return <Secret>await firstValueFrom(this.http.post(`${environment.fmUrl}/secrets/`, secret));
  }

  deleteMany(ids: string[]) {
    return from(ids).pipe(mergeMap((id) => this.http.delete(`${environment.fmUrl}/secrets/${id}`).pipe(map(() => id))));
  }

  private filterSecret(secret: Secret, filters: string[], projects: ProjectSummary[]) {
    const parts = [secret?.name, projects?.find((p) => p.id === secret._id)?.name, secret.description];
    return filters.some((filter) => normalizeSearchString(parts.join(' ')).includes(filter));
  }
}
