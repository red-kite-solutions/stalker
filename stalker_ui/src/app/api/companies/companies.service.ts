import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Company } from 'src/app/shared/types/company/company.interface';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CompaniesService {
  constructor(private http: HttpClient) {}

  public getAll(): Observable<Company[]> {
    return this.http.get(`${environment.fmUrl}/company`) as Observable<Company[]>;
  }

  public getAllSummaries(): Observable<CompanySummary[]> {
    return this.http
      .get(`${environment.fmUrl}/company/summary`)
      .pipe(map((companies: any) => companies.map((x: any) => ({ ...x, id: x._id })))) as Observable<CompanySummary[]>;
  }

  public get(id: string) {
    return this.http.get<Company>(`${environment.fmUrl}/company/${id}`);
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
