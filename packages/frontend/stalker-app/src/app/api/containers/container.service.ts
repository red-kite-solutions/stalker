import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Container } from '../../shared/types/jobs/container.type';

@Injectable({
  providedIn: 'root',
})
export class ContainerService {
  constructor(private http: HttpClient) {}

  public getContainers(): Observable<Container[]> {
    return this.http.get<Array<Container>>(`${environment.fmUrl}/containers/`);
  }

  public getContainer(id: string) {
    return this.http.get<Container>(`${environment.fmUrl}/containers/${id}`);
  }
}
