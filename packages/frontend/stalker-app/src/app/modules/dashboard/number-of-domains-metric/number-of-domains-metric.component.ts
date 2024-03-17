import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { map } from 'rxjs';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { SimpleMetric } from '../simple-metric/simple-metric.component';

@Component({
  standalone: true,
  selector: 'number-of-domains-metric',
  template: `<simple-metric [value]="value$ | async" [title]="name"></simple-metric>`,
  imports: [CommonModule, SimpleMetric],
})
export class NumberOfDomainsMetric {
  public value$ = this.domainService.getPage(0, 1).pipe(map((x) => `${x.totalRecords}`));

  public get name() {
    return $localize`:Number of domains|:Number of domains`;
  }

  constructor(private domainService: DomainsService) {}
}
