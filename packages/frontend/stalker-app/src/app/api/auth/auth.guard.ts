import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authenticationGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);

  if (authService.isRefreshValid()) return true;

  const router = inject(Router);
  const returnUrl = state.url;
  return router.createUrlTree(['/auth', 'login'], {
    queryParams: {
      returnUrl,
    },
  });
};
