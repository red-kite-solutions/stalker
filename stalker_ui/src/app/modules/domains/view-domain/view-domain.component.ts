import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, switchMap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Host } from 'src/app/shared/types/host/host.interface';
import { HostSummary } from 'src/app/shared/types/host/host.summary';
import { Tag } from 'src/app/shared/types/tag.type';

@Component({
  selector: 'app-view-domain',
  templateUrl: './view-domain.component.html',
  styleUrls: ['./view-domain.component.scss'],
})
export class ViewDomainComponent {
  public routeLoading = false;
  displayedColumns: string[] = ['ipAddress', 'ports'];

  // Host drawer
  public selectedHost: HostSummary | null = null;
  public hostDetails$: Observable<Host> | null = null;

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
    shareReplay(1)
  );

  public ipAddressesDataSourceShowCount$ = new BehaviorSubject(8);
  public ipAddressesDataSource$ = combineLatest([this.domain$, this.ipAddressesDataSourceShowCount$]).pipe(
    map(([domain, size]) => domain.hosts.map((h) => ({ ...h, ports$: this.getTopPorts(h.id) })).slice(0, size))
  );
  constructor(
    private route: ActivatedRoute,
    private domainsService: DomainsService,
    private hostsService: HostsService,
    private companiesService: CompaniesService,
    private tagsService: TagsService
  ) {}

  private getTopPorts(hostId: string) {
    return this.hostsService
      .getPorts(hostId, 0, 10, { sortType: 'popularity' })
      .pipe(map((ports: number[]) => ports.sort((a, b) => a - b)));
  }

  public selectHostAndView(hostSummary: HostSummary) {
    const previousSelection = this.selectedHost;
    this.selectedHost = hostSummary;

    if (previousSelection && previousSelection.id === this.selectedHost.id) {
      this.selectedHost = null;
      return;
    }

    this.hostDetails$ = this.hostsService.get(this.selectedHost.id).pipe(
      map((hd: Host) => {
        hd.ports = hd.ports.sort((a, b) => a?.port - b?.port);
        return hd;
      })
    );
  }

  public close() {
    this.hostDetails$ = null;
    this.selectedHost = null;
  }
}
