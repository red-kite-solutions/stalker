import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomFinding } from '../../shared/types/finding/finding.type';
import { Page } from '../../shared/types/page.type';

@Injectable({
  providedIn: 'root',
})
export class FindingsService {
  constructor(private http: HttpClient) {}

  public getFindings(target: string, page = 1, pageSize = 25): Observable<Page<CustomFinding>> {
    return this.http
      .get<Page<CustomFinding>>(`${environment.fmUrl}/findings?target=${target}&page=${page}&pageSize=${pageSize}`)
      .pipe(tap((x) => (x.items = x.items.map((i) => ({ ...i, created: new Date() })))));
  }
}
