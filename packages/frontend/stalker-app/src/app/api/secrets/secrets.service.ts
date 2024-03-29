import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, from, map, mergeMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Secret } from '../../shared/types/secret.type';

@Injectable({
  providedIn: 'root',
})
export class SecretService {
  constructor(private http: HttpClient) {}

  getSecrets(): Observable<Secret[]> {
    return <Observable<Array<Secret>>>this.http.get(`${environment.fmUrl}/secrets/`);
  }

  async create(secret: Omit<Secret, '_id'>) {
    return <Secret>await firstValueFrom(this.http.post(`${environment.fmUrl}/secrets/`, secret));
  }

  deleteMany(ids: string[]) {
    return from(ids).pipe(mergeMap((id) => this.http.delete(`${environment.fmUrl}/secrets/${id}`).pipe(map(() => id))));
  }
}
