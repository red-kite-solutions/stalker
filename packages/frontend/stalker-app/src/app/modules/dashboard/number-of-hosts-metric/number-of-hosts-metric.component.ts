import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { map } from 'rxjs';
import { HostsService } from '../../../api/hosts/hosts.service';
import { SimpleMetric } from '../simple-metric/simple-metric.component';

@Component({
  standalone: true,
  selector: 'number-of-hosts-metric',
  imports: [CommonModule, SimpleMetric],
  template: `<simple-metric [value]="value$ | async" [title]="name"></simple-metric>`,
})
export class NumberOfHostsMetric {
  public value$ = this.hostService.getPage(0, 1).pipe(map((x) => `${x.totalRecords}`));

  public get name() {
    return $localize`:Number of hosts|:Number of hosts`;
  }

  constructor(private hostService: HostsService) {}
}
