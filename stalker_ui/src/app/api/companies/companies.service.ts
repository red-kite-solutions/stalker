import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Company } from 'src/app/shared/types/company/company.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CompaniesService {
  constructor(private http: HttpClient) {}

  public getAll(): Observable<Array<any>> {
    return this.http.get(`${environment.fmUrl}/company`) as Observable<Array<any>>;
  }

  public getAllSummaries(): Observable<Array<any>> {
    return this.http.get(`${environment.fmUrl}/company/summary`) as Observable<Array<any>>;
  }

  public get(id: string) {
    return this.http.get(`${environment.fmUrl}/company/${id}`) as Observable<Company>;
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/company/${id}`));
  }

  public async create(companyName: string, companyLogo: string | null = null, imageType: string | null = null) {
    return await firstValueFrom(
      this.http.post<Company>(`${environment.fmUrl}/company`, {
        name: companyName,
        logo: companyLogo,
        imageType: imageType,
      })
    );
  }

  public async edit(id: string, data: any) {
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/company/${id}`, data));
  }
}
