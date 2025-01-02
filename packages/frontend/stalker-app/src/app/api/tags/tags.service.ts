import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../../shared/types/page.type';
import { Tag } from '../../shared/types/tag.type';
import { normalizeSearchString } from '../../utils/normalize-search-string';

@Injectable({
  providedIn: 'root',
})
export class TagsService {
  constructor(private http: HttpClient) {}

  public getTags(filters?: string[], page?: number, pageSize?: number): Observable<Page<Tag>> {
    return this.http.get<Tag[]>(`${environment.fmUrl}/tags/`).pipe(
      map((tags) => tags.sort((a, b) => a._id.localeCompare(b._id))),
      map((tags) => tags.filter((job) => !filters?.length || this.filterTags(job, filters))),
      map((tags) => {
        if (page == null || pageSize == null) return { items: tags, totalRecords: tags.length };
        return { items: tags.slice(page * pageSize, page * pageSize + pageSize), totalRecords: tags.length };
      })
    );
  }

  public getAllTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${environment.fmUrl}/tags/`);
  }

  public async createTag(text: string, color: string): Promise<Tag> {
    return await firstValueFrom(this.http.post<Tag>(`${environment.fmUrl}/tags/`, { text: text, color: color }));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/tags/${id}`));
  }
  private filterTags(secret: Tag, filters: string[]) {
    const parts = [secret?.text, secret.color];
    return filters.some((filter) => normalizeSearchString(parts.join(' ')).includes(filter));
  }
}
