import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Group } from '../../shared/types/group/group.type';
import { Page } from '../../shared/types/page.type';
import { filtersToParams } from '../../utils/filters-to-params';

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

  public async setUserGroupMembership(userId: string, groupId: string, isMember: boolean) {
    return await this.http.patch(`${environment.fmUrl}/groups/${groupId}`, { userId, isMember });
  }
}
