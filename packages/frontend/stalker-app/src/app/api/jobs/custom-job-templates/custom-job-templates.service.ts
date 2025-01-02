import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CustomJobTemplate, CustomJobTemplateSummary } from '../../../shared/types/jobs/custom-job-template.type';

@Injectable({
  providedIn: 'root',
})
export class CustomJobTemplatesService {
  constructor(private http: HttpClient) {}

  public getAll(): Observable<CustomJobTemplate[]> {
    return <Observable<CustomJobTemplate[]>>this.http.get(`${environment.fmUrl}/custom-job-templates/`);
  }

  public getAllSummaries(): Observable<CustomJobTemplateSummary[]> {
    return <Observable<CustomJobTemplateSummary[]>>this.http.get(`${environment.fmUrl}/custom-job-templates/summary`);
  }

  public get(id: string): Observable<CustomJobTemplate> {
    return <Observable<CustomJobTemplate>>this.http.get(`${environment.fmUrl}/custom-job-templates/${id}`);
  }
}
