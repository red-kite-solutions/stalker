import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Group } from '../../shared/types/group/group.type';
import { Page } from '../../shared/types/page.type';
import { Observable } from 'rxjs';
import { filtersToParams } from '../../utils/filters-to-params';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  constructor(private http: HttpClient) {}

  public get(id: string): Observable<Group> {
    return <Observable<Group>>this.http.get(`${environment.fmUrl}/groups/${id}`);
  }

  public getPage(page: number, pageSize: number, filters: any = undefined): Observable<Page<Group>> {
    let params = filtersToParams(filters);
    params = params.append('page', page);
    params = params.append('pageSize', pageSize);
    return this.http.get<Page<Group>>(`${environment.fmUrl}/groups`, { params });
  }

  public async addUserToGroup(userId: string, groupId: string) {
    return await this.http.patch(`${environment.fmUrl}/groups/${groupId}`, { userId });
  }
}
