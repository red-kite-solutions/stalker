import { Injectable } from '@angular/core';
import { EventType, NavigationEnd, Router } from '@angular/router';
import { filter, map, pairwise, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PreviousRouteService {
  public previousRoute$ = this.router.events.pipe(
    filter((x) => x?.type === EventType.NavigationEnd),
    pairwise(),
    map(([previousNavigation]) => (previousNavigation as NavigationEnd).url),
    shareReplay(1)
  );

  constructor(private router: Router) {
    this.previousRoute$.subscribe();
  }
}
