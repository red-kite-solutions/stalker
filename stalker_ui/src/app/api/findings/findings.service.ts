import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Finding } from '../../shared/types/finding/finding.type';
import { Page } from '../../shared/types/page.type';

@Injectable({
  providedIn: 'root',
})
export class FindingsService {
  constructor(private http: HttpClient) {}

  public getFindings(target: string, page = 1, pageSize = 25): Observable<Page<Finding>> {
    return <Observable<Page<Finding>>>(
      this.http.get(`${environment.fmUrl}/findings?target=${target}&page=${page}&pageSize=${pageSize}`)
    );
  }
}
