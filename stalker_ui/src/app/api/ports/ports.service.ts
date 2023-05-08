import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Port, PortNumber } from '../../shared/types/ports/port.interface';

@Injectable({
  providedIn: 'root',
})
export class PortsService {
  constructor(private http: HttpClient) {}

  public getPorts(
    hostId: string,
    page: number,
    pageSize: number,
    options: {
      protocol?: 'tcp' | 'udp' | null;
      detailsLevel?: 'full' | 'summary' | 'number' | null;
      sortType?: 'popularity' | 'port' | null;
      sortOrder?: 'ascending' | 'descending' | null;
    } | null = null
  ): Observable<PortNumber[]> {
    let params = new HttpParams();
    if (options) {
      if (options.protocol) params = params.set('protocol', options.protocol);
      if (options.detailsLevel) params = params.set('detailsLevel', options.detailsLevel);
      if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);
      if (options.sortType) params = params.set('sortType', options.sortType);
    }
    params = params.set('hostId', hostId);
    params = params.set('page', page);
    params = params.set('pageSize', pageSize);

    return <Observable<PortNumber[]>>this.http.get(`${environment.fmUrl}/ports/?${params.toString()}`);
  }

  public async tagPort(portId: string, tagId: string, isTagged: boolean) {
    return await firstValueFrom(
      this.http.put(`${environment.fmUrl}/ports/${portId}/tags`, { tagId: tagId, isTagged: isTagged })
    );
  }

  public getPort(portId: string) {
    return <Observable<Port>>this.http.get(`${environment.fmUrl}/ports/${portId}`);
  }
}
