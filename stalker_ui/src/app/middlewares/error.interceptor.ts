import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpStatus } from '../shared/types/http-status.type';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toastr: ToastrService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err) => {
        if (err.status === HttpStatus.Unauthorized) this.router.navigate(['/auth/login']);
        if (err.status === HttpStatus.InternalServerError)
          this.toastr.error($localize`:Server error|The server responded with an error:Server error occured`);
        if (err.status === HttpStatus.TimeOut)
          this.toastr.error($localize`:Request timed out|The request to the server timed out:Request timed out`);
        return throwError(() => err);
      })
    );
  }
}
