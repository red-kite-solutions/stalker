import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { getReturnUrl } from '../../utils/return-url';
import { refreshTokenName, tokenName } from '../constants';

export interface AuthTokenProvider {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements AuthTokenProvider {
  private _token: string | undefined;
  private _role: string | undefined;
  private _email: string | undefined;
  private _id: string | undefined;
  private refreshToken: string | undefined;
  private decodedToken: any;
  private decodedRefreshToken: any;

  public get token(): string {
    return this._token ? this._token : '';
  }

  public get role(): string {
    return this._role ? this._role : '';
  }

  public get email(): string {
    return this._email ? this._email : '';
  }

  public get id(): string {
    return this._id ? this._id : '';
  }

  constructor(private http: HttpClient, private router: Router) {
    const token: string | null = localStorage.getItem(tokenName);
    const refresh: string | null = localStorage.getItem(refreshTokenName);
    if (token && refresh) {
      this.initSession(token);
      this.initRefreshToken(refresh);
    } else {
      this.router.navigate([`/auth/login`], {
        queryParams: {
          returnUrl: getReturnUrl(this.router),
        },
      });
    }
  }

  private initSession(token: string) {
    this.decodedToken = jwt_decode(token);
    const epochNow = Math.floor(Date.now() / 1000);
    if (this.decodedToken.exp > epochNow) {
      localStorage.setItem(tokenName, token);
      this._token = token;
      this._role = this.decodedToken.role;
      this._email = this.decodedToken.email;
      this._id = this.decodedToken.id;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  private initRefreshToken(token: string) {
    this.decodedRefreshToken = jwt_decode(token);
    const epoch = Math.floor(Date.now() / 1000);
    if (this.decodedRefreshToken.exp > epoch) {
      localStorage.setItem(refreshTokenName, token);
      this.refreshToken = token;
    }
  }

  public async login(email: string, password: string): Promise<boolean> {
    let data: any;
    try {
      data = await firstValueFrom(
        this.http.post(`${environment.fmUrl}/auth/login`, {
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

  public async logout() {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.fmUrl}/auth/logout`, { body: { refresh_token: this.refreshToken } })
      );
    } finally {
      localStorage.removeItem(tokenName);
      localStorage.removeItem(refreshTokenName);
      this._token = '';
      this._email = '';
      this._role = '';
      this._id = '';
      this.refreshToken = '';
      this.decodedRefreshToken = {};
      this.decodedToken = {};
    }
  }

  public async refresh(): Promise<boolean> {
    try {
      const data: any = await firstValueFrom(
        this.http.put(`${environment.fmUrl}/auth/refresh`, {
          refresh_token: this.refreshToken,
        })
      );
      this.initSession(data.access_token);
    } catch {
      return false;
    }

    return true;
  }

  public isTokenValid(): boolean {
    const epoch = Math.floor(Date.now() / 1000);
    return this.decodedToken?.exp > epoch;
  }

  public isRefreshValid(): boolean {
    const epoch = Math.floor(Date.now() / 1000);
    return this.decodedRefreshToken?.exp > epoch;
  }
}
