import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { fmUrl } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class TagsService {
  constructor(private http: HttpClient) {}

  public getTags(): Observable<any[]> {
    return <Observable<Array<any>>>this.http.get(`${fmUrl}/tags/`);
  }
}
