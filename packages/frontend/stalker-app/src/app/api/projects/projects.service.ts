import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Project } from '../../shared/types/project/project.interface';
import { ProjectSummary } from '../../shared/types/project/project.summary';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  constructor(private http: HttpClient) {}

  public getAll(): Observable<Project[]> {
    return this.http.get(`${environment.fmUrl}/project`) as Observable<Project[]>;
  }

  public getAllSummaries(): Observable<ProjectSummary[]> {
    return this.http
      .get(`${environment.fmUrl}/project/summary`)
      .pipe(map((projects: any) => projects.map((x: any) => ({ ...x, id: x._id })))) as Observable<ProjectSummary[]>;
  }

  public get(id: string) {
    return this.http.get<Project>(`${environment.fmUrl}/project/${id}`);
  }

  public async delete(id: string) {
    return await firstValueFrom(this.http.delete(`${environment.fmUrl}/project/${id}`));
  }

  public async create(projectName: string, projectLogo: string | null = null, imageType: string | null = null) {
    return await firstValueFrom(
      this.http.post<Project>(`${environment.fmUrl}/project`, {
        name: projectName,
        logo: projectLogo,
        imageType: imageType,
      })
    );
  }

  public async edit(id: string, data: any) {
    return await firstValueFrom(this.http.put(`${environment.fmUrl}/project/${id}`, data));
  }
}
