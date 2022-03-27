import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StatusString } from 'src/app/shared/types/status-string.type';
import { fmUrl } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  public async submitSettings(settings: any): Promise<StatusString> {
    try {
      const data: any = await firstValueFrom(this.http.put(`${fmUrl}/admin/config`, settings));
      return data.status;
    } catch (err) {
      return 'Error';
    }
  }

  public async getSettings(): Promise<any> {
    try {
      return firstValueFrom(this.http.get(`${fmUrl}/admin/config`));
    } catch (err) {
      return 'Error';
    }
  }
}
