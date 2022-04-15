import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { fmUrl } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  public async submitSettings(settings: any): Promise<any> {
    return await firstValueFrom(this.http.put(`${fmUrl}/admin/config`, settings));
  }

  public async getSettings(): Promise<any> {
    return firstValueFrom(this.http.get(`${fmUrl}/admin/config`));
  }
}
