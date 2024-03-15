import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Tag } from '../../shared/types/tag.type';

@Injectable({
  providedIn: 'root',
})
export class TagsService {
  constructor(private http: HttpClient) {}

  public getTags(): Observable<any[]> {
    return <Observable<Array<any>>>this.http.get(`${environment.fmUrl}/tags/`);
  }

  public async createTag(text: string, color: string): Promise<Tag> {
    return <Tag>await firstValueFrom(this.http.post(`${environment.fmUrl}/tags/`, { text: text, color: color }));
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/tags/${id}`));
  }
}
