import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SearchTerms } from '@red-kite/common/search-query';
import { map, switchMap } from 'rxjs';
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
  public value$ = globalProjectFilter$.pipe(
    switchMap((project) => {
      const query: SearchTerms = [];
      if (project)
        query.push({
          type: 'project.id',
          value: project.id,
        });
      return this.hostService.getPage(0, 1, query).pipe(map((x) => `${x.totalRecords}`));
    })
  );

  public get name() {
    return $localize`:Number of hosts|:Number of hosts`;
  }

  constructor(private hostService: HostsService) {}
}
