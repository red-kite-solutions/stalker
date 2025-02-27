import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
  @Input() public set additionalFilters(filters: { [key: string]: string | string[] }) {
    this._additionalFilters$.next(filters);
  }

  private _additionalFilters$: BehaviorSubject<{ [key: string]: string | string[] }> = new BehaviorSubject<{
    [key: string]: string | string[];
  }>({});

  public value$ = combineLatest([this._additionalFilters$, globalProjectFilter$]).pipe(
    switchMap(([filters, project]) => {
      const projects = [];
      if (project) projects.push(project.id);
      return this.hostService.getPage(0, 1, { projects, ...filters }).pipe(map((x) => `${x.totalRecords}`));
    })
  );

  constructor(private hostService: HostsService) {}
}
