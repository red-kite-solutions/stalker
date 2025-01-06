import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JobPodSettings } from '../../shared/types/settings/job-pod-settings.type';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  public async submitSettings(settings: any): Promise<any> {
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/admin/config`, settings));
  }

  public getSettings(): Observable<any> {
    return this.http.get(`${environment.fmUrl}/admin/config`);
  }

  public getJobPodSettings(): Observable<JobPodSettings[]> {
    return <Observable<JobPodSettings[]>>this.http.get(`${environment.fmUrl}/admin/config/job-pods`);
  }
}
