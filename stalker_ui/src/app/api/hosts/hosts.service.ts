import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Host } from 'src/app/shared/types/host/host.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HostsService {
  constructor(private http: HttpClient) {}

  public get(hostId: string): Observable<Host> {
    return <Observable<Host>>this.http.get(`${environment.fmUrl}/hosts/${hostId}`);
  }

  public getTopPorts(hostId: string, top: number): Observable<number[]> {
    return <Observable<number[]>>this.http.get(`${environment.fmUrl}/hosts/${hostId}/top-tcp-ports/${top}`);
  }
}
