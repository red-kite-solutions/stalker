import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { fmUrl } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  public async submitSettings(settings: any): Promise<any> {
    return await firstValueFrom(this.http.put(`${fmUrl}/admin/config`, settings));
  }

  public getSettings(): Observable<any> {
    return this.http.get(`${fmUrl}/admin/config`);
  }
}
