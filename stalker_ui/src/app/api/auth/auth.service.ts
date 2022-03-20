import { Injectable } from '@angular/core';
import { fmUrl, tokenName, refreshTokenName } from '../constants';
import { firstValueFrom, Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import jwt_decode from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _token: string = '';
  private _refreshToken: string = '';
  private _role: string = '';
  private _email: string = '';
  private decodedToken: any = {};
  private decodedRefreshToken: any = {};

  public get token(): string {
    return this._token;
  }

  public get role(): string {
    return this._role;
  }

  public get email(): string {
    return this._email;
  }

  constructor(private http: HttpClient, private router: Router) {
    const token: string | null = localStorage.getItem(tokenName);
    const refresh: string | null = localStorage.getItem(refreshTokenName);
    if (token && refresh) {
      this.initSession(token);
      this.initRefreshToken(refresh);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  private initSession(token: string) {
    this.decodedToken = jwt_decode(token);
    const epochNow = Math.floor(new Date().getTime() / 1000);
    if (this.decodedToken.exp > epochNow) {
      localStorage.setItem(tokenName, this._token);
      this._token = token;
      this._role = this.decodedToken.role;
      this._email = this.decodedToken.email;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  private initRefreshToken(token: string) {
    this.decodedRefreshToken = jwt_decode(token);
    const epoch = Math.floor(new Date().getTime() / 1000);
    if (this.decodedRefreshToken.exp > epoch) {
      localStorage.setItem(refreshTokenName, this._refreshToken);
      this._refreshToken = token;
    }
  }

  public async login(email: string, password: string): Promise<boolean> {
    let data: any;
    try {
      data = await firstValueFrom(
        this.http.post(`${fmUrl}/auth/login`, {
          email: email,
          password: password,
        })
      );
    } catch {
      return false;
    }

    if (data) {
      this.initSession(data.access_token);
      this.initRefreshToken(data.refresh_token);

      return true;
    }

    return false;
  }

  public logout() {
    localStorage.removeItem(tokenName);
    this._token = '';
    this._email = '';
    this._role = '';
    this.decodedToken = {};
  }

  public async refresh(): Promise<boolean> {
    try {
      const data: any = await firstValueFrom(
        this.http.put(`${fmUrl}/auth/refresh`, {
          refresh_token: this._refreshToken,
        })
      );
      this.initSession(data.access_token);
    } catch {
      return false;
    }

    return true;
  }

  public isTokenValid(): boolean {
    const epoch = Math.floor(new Date().getTime() / 1000);
    return this.decodedToken?.exp > epoch;
  }

  public isRefreshValid(): boolean {
    const epoch = Math.floor(new Date().getTime() / 1000);
    return this.decodedRefreshToken?.exp > epoch;
  }
}
