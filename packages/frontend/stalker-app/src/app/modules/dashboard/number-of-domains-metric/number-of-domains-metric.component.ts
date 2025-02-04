import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SearchTerms } from '@red-kite/common/search-query';
import { map, switchMap } from 'rxjs';
import { DomainsService } from '../../../api/domains/domains.service';
import { globalProjectFilter$ } from '../../../utils/global-project-filter';
import { SimpleMetric } from '../simple-metric/simple-metric.component';

@Component({
  standalone: true,
  selector: 'number-of-domains-metric',
  template: `<simple-metric [value]="value$ | async" [title]="name"></simple-metric>`,
  imports: [CommonModule, SimpleMetric],
})
export class NumberOfDomainsMetric {
  public value$ = globalProjectFilter$.pipe(
    switchMap((project) => {
      const query: SearchTerms = [];
      if (project)
        query.push({
          type: 'project.id',
          value: project.id,
        });
      return this.domainService.getPage(0, 1, query).pipe(map((x) => `${x.totalRecords}`));
    })
  );

  public get name() {
    return $localize`:Number of domains|:Number of domains`;
  }

  constructor(private domainService: DomainsService) {}
}
