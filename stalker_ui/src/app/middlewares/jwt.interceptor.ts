import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, from, mergeMap, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../api/auth/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (
      request.url.startsWith(`${environment.fmUrl}/auth/login`) ||
      request.url.startsWith(`${environment.fmUrl}/auth/refresh`)
    ) {
      return next.handle(request);
    }
    const isApiUrl = request.url.startsWith(environment.fmUrl);
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
            mergeMap((isConnected) => (isConnected ? next.handle(request) : EMPTY))
          );
        }
      }
    }

    return next.handle(request);
  }
}
