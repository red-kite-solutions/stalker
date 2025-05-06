import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SearchTerms } from '@red-kite/common/search-query';
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';
import { HostsService } from '../../../api/hosts/hosts.service';
import { globalProjectFilter$ } from '../../../utils/global-project-filter';
import { SimpleMetric } from '../simple-metric/simple-metric.component';

@Component({
  standalone: true,
  selector: 'number-of-hosts-metric',
  imports: [CommonModule, SimpleMetric],
  template: `<simple-metric [value]="value$ | async" [title]="name"></simple-metric>`,
})
export class NumberOfHostsMetric {
  @Input() public name = $localize`:Number of hosts|:Number of hosts`;

  private _additionalFilters$: BehaviorSubject<{ [key: string]: string | string[] }> = new BehaviorSubject<{
    [key: string]: string | string[];
  }>({});
  @Input() public set additionalFilters(filters: { [key: string]: string | string[] }) {
    this._additionalFilters$.next(filters);
  }

  public value$ = combineLatest([globalProjectFilter$, this._additionalFilters$]).pipe(
    switchMap(([project, additionalFilters]) => {
      const query: SearchTerms = [];

      if (project) {
        query.push({
          type: 'project.id',
          value: project.id,
        });
      }

      if (additionalFilters) {
        // TODO #319
      }

      return this.hostService.getPage(0, 1, query).pipe(map((x) => `${x.totalRecords}`));
    })
  );

  constructor(private hostService: HostsService) {}
}
