import { Router } from '@angular/router';

export function getReturnUrl(router: Router) {
  if (!router) return undefined;

  const url = router.url;
  if (!url) return undefined;
  if (url.startsWith('/auth/login')) return undefined;

  return url;
}
