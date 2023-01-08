import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Tag } from 'src/app/shared/types/tag.type';

@Component({
  selector: 'app-view-domain',
  templateUrl: './view-domain.component.html',
  styleUrls: ['./view-domain.component.scss'],
})
export class ViewDomainComponent {
  public routeLoading = false;
  displayedColumns: string[] = ['ipAddress', 'ports'];

  companies: CompanySummary[] = [];
  companies$ = this.companiesService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: CompanySummary[] = [];
      for (const company of next) {
        comp.push({ id: company._id, name: company.name });
      }
      this.companies = comp;
      return this.companies;
    })
  );

  tags: Tag[] = [];
  tags$ = this.tagsService.getTags().pipe(
    map((next: any[]) => {
      const tagsArr: Tag[] = [];
      for (const tag of next) {
        tagsArr.push({ id: tag._id, text: tag.text, color: tag.color });
      }
      this.tags = tagsArr;
      return this.tags;
    })
  );

  public domain$ = this.route.params.pipe(
    switchMap((params) => this.domainsService.get(params['id'])),
    tap((domain) => this.titleService.setTitle($localize`:Domain page title|:Domains · ${domain.name}`)),
    shareReplay(1)
  );

  public showAllPorts: { [ip: string]: boolean } = {};

  public ipAddressesDataSourceShowCount$ = new BehaviorSubject(8);
  public ipAddresses$ = combineLatest([this.domain$, this.ipAddressesDataSourceShowCount$]).pipe(
    map(([domain, size]) =>
      domain.hosts
        .map((h) => {
          const ports$ = this.getTopPorts(h.id);
          return {
            ...h,
            portsSubset$: ports$.pipe(map((p) => p.slice(0, 12))),
            ports$: ports$,
            numberOfPorts$: ports$.pipe(map((p) => p.length)),
          };
        })
        .slice(0, size)
    )
  );
  constructor(
    private route: ActivatedRoute,
    private domainsService: DomainsService,
    private hostsService: HostsService,
    private companiesService: CompaniesService,
    private tagsService: TagsService,
    private titleService: Title
  ) {}

  private getTopPorts(hostId: string) {
    return this.hostsService.getPorts(hostId, 0, 65535, { sortType: 'popularity' }).pipe(
      map((ports: number[]) => ports.sort((a, b) => a - b)),
      shareReplay(1)
    );
  }
}
