import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, EventType, Router } from '@angular/router';
import { filter, map, pairwise, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PreviousRouteService {
  public previousRoute$ = this.router.events.pipe(
    filter((x) => x?.type === EventType.NavigationEnd),
    map(() => this.activatedRoute.snapshot),
    pairwise(),
    map(([previousSnapshot]) => {
      const url = this.getFullUrl(previousSnapshot);
      const queryParams = previousSnapshot.queryParams;
      return { url, queryParams };
    }),
    shareReplay(1)
  );

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.previousRoute$.subscribe();
  }

  /**
   * Constructs the full URL from an ActivatedRouteSnapshot.
   */
  private getFullUrl(snapshot: ActivatedRouteSnapshot): string {
    let path = '';
    while (snapshot) {
      path = `${snapshot.url.map((segment) => segment.path).join('/')}/${path}`;
      if (!snapshot.parent) break;

      snapshot = snapshot.parent;
    }
    return `/${path}`.replace(/\/+$/, '');
  }
}
