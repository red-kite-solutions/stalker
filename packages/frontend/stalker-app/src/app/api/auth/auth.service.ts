import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getReturnUrl } from '../../utils/return-url';
import { refreshTokenName, tokenName } from '../constants';

export interface AuthTokenProvider {
  token: string;
}

export interface IsServerSetup {
  isSetup: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements AuthTokenProvider {
  private _token: string | undefined;
  private _scopes: string[] | undefined;
  private _email: string | undefined;
  private _id: string | undefined;
  private refreshToken: string | undefined;
  private decodedToken: any;
  private decodedRefreshToken: any;

  public get token(): string {
    return this._token ? this._token : '';
  }

  public get scopes(): string[] {
    return this._scopes ? this._scopes : [];
  }

  public get email(): string {
    return this._email ? this._email : '';
  }

  public get id(): string {
    return this._id ? this._id : '';
  }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const token: string | null = localStorage.getItem(tokenName);
    const refresh: string | null = localStorage.getItem(refreshTokenName);
    if (token && refresh) {
      this.initSession(token);
      this.initRefreshToken(refresh);
    }
  }

  private initSession(token: string) {
    this.decodedToken = jwtDecode(token);
    const epochNow = Math.floor(Date.now() / 1000);
    if (this.decodedToken.exp > epochNow) {
      localStorage.setItem(tokenName, token);
      this._token = token;
      this._scopes = this.decodedToken.scopes;
      this._email = this.decodedToken.email;
      this._id = this.decodedToken.id;
    } else {
      this.router.navigate(['/auth/login'], {
        queryParams: {
          returnUrl: getReturnUrl(this.router),
        },
      });
    }
  }

  public async checkServerSetup(isOnLogin = false) {
    const isSetup = <IsServerSetup>await firstValueFrom(this.http.get(`${environment.fmUrl}/auth/setup`));

    if (!isSetup.isSetup) {
      this.router.navigate(['/auth/first']);
    } else {
      if (!isOnLogin) this.router.navigate(['/auth/login']);
    }
  }

  private initRefreshToken(token: string) {
    this.decodedRefreshToken = jwtDecode(token);
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

  public async loginUsingToken(token: string): Promise<boolean> {
    let data: any;
    try {
      data = await firstValueFrom(
        this.http.post(`${environment.fmUrl}/auth/login-magic-link`, {
          token,
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
      this._scopes = [];
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

  public userHasScope(scope: string) {
    // '*' is explicitely excluded as a possible valid scope to prevent including the reset password scope
    // Therefore, do not write: const possibleValidScopes = new Set(['*', requiredScope]);
    const possibleValidScopes: Set<string> = new Set([scope]);
    const splitRequiredScope = scope.split(':');

    for (let i = 0; i < splitRequiredScope.length - 1; ++i) {
      const newPossibility: string[] = [];
      for (let j = 0; j <= i; ++j) {
        newPossibility.push(splitRequiredScope[j]);
      }
      newPossibility.push('*');
      possibleValidScopes.add(newPossibility.join(':'));
    }

    const validScopes = [...possibleValidScopes];

    for (const userScope of this.scopes) {
      if (validScopes.findIndex((v) => userScope === v) !== -1) return true;
    }
    return false;
  }
}
