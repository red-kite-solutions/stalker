import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { EMPTY, from, map, mergeMap, Observable, switchMap, tap } from 'rxjs';

import { fmUrl } from '../api/constants';
import { AuthService } from '../api/auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.url.startsWith(`${fmUrl}/auth/`)) {
      return next.handle(request);
    }
    const isApiUrl = request.url.startsWith(fmUrl);
    if (isApiUrl) {
      if (this.authService.isTokenValid()) {
        request = request.clone({
          setHeaders: { Authorization: `Bearer ${this.authService.token}` },
        });
      } else {
        if (this.authService.isRefreshValid()) {
          return from(this.authService.refresh()).pipe(
            tap((isConnected) =>
              isConnected
                ? (request = request.clone({
                    setHeaders: {
                      Authorization: `Bearer ${this.authService.token}`,
                    },
                  }))
                : this.router.navigate(['/auth/login'])
            ),
            mergeMap((isConnected) =>
              isConnected ? next.handle(request) : EMPTY
            )
          );
        }
      }
    }

    return next.handle(request);
  }
}
