import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, Subscription, switchMap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { Host } from 'src/app/shared/types/host/host.interface';
import { HostSummary } from 'src/app/shared/types/host/host.summary';
import { Tag } from 'src/app/shared/types/tag.type';

@Component({
  selector: 'app-view-domain',
  templateUrl: './view-domain.component.html',
  styleUrls: ['./view-domain.component.scss'],
})
export class ViewDomainComponent implements OnDestroy {
  public routeLoading = false;
  public domainId = '';
  public domain: Domain | null = null;
  dataSource = new MatTableDataSource<HostSummary & { ports?: number[] }>();
  displayedColumns: string[] = ['ipAddress', 'ports'];
  hostPortsSubs: Subscription[] = [];

  // Host drawer
  public selectedHost: HostSummary | null = null;
  public hostDetails: Host | null = null;
  public hostDetails$: Observable<Host> | null = null;
  public hostDomainsDataSource = new MatTableDataSource<DomainSummary>();
  public hostPortsDataSource = new MatTableDataSource<number>();

  @ViewChild(MatPaginator) paginator: MatPaginator | null;
  @ViewChild(MatDrawer) hostDrawer: MatDrawer | null;

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

  public routeSub$ = this.route.params
    .pipe(
      switchMap((params) => {
        this.routeLoading = true;
        this.domainId = params['id'];
        return this.domainsService.get(this.domainId);
      })
    )
    .pipe(
      map((domain: Domain) => {
        this.routeLoading = false;
        this.domain = domain;
        this.dataSource.data = domain.hosts;
        this.dataSource.paginator = this.paginator;

        if (this.paginator) {
          this.paginator._intl.itemsPerPageLabel = $localize`:Items per page|Paginator items per page label:Items per page`;
          this.paginator._intl.nextPageLabel = $localize`:Next page|Paginator next page label:Next page`;
          this.paginator._intl.lastPageLabel = $localize`:Last page|Paginator last page label:Last page`;
          this.paginator._intl.previousPageLabel = $localize`:Previous page|Paginator previous page label:Previous page`;
          this.paginator._intl.firstPageLabel = $localize`:First page|Paginator first page label:First page`;
          this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
            const low = page * pageSize + 1;
            const high = page * pageSize + pageSize <= length ? page * pageSize + pageSize : length;
            return $localize`:Paginator range|Item numbers and range of the paginator:${low} – ${high} of ${length}`;
          };
        }

        for (const h of domain.hosts) {
          this.hostPortsSubs.push(
            this.hostsService
              .getPorts(h.id, 0, 10, { sortType: 'popularity' })
              .pipe(
                map((ports: number[]) => {
                  for (const summary of this.dataSource.data) {
                    summary.ports = ports.sort((a, b) => a - b);
                  }
                  this.dataSource.paginator = this.paginator;
                })
              )
              .subscribe()
          );
        }
      })
    );

  constructor(
    private route: ActivatedRoute,
    private domainsService: DomainsService,
    private hostsService: HostsService,
    private companiesService: CompaniesService,
    private tagsService: TagsService
  ) {
    this.paginator = null;
    this.hostDrawer = null;
  }

  public selectHostAndView(hostSummary: HostSummary) {
    const previousSelection = this.selectedHost;
    this.selectedHost = hostSummary;

    if (previousSelection && previousSelection.id === this.selectedHost.id) {
      this.hostDrawer?.close();
      this.selectedHost = null;
      return;
    }

    if (!previousSelection) {
      this.hostDrawer?.open();
    }

    this.hostDetails$ = this.hostsService.get(this.selectedHost.id).pipe(
      map((hd: Host) => {
        this.hostDetails = hd;
        this.hostDomainsDataSource.data = hd.domains;
        this.hostPortsDataSource.data = hd.ports;
        return hd;
      })
    );
  }

  public ngOnDestroy(): void {
    for (const sub of this.hostPortsSubs) {
      sub.unsubscribe();
    }
  }
}
