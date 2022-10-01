import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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
}
