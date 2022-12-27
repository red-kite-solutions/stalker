import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { Host, Port } from 'src/app/shared/types/host/host.interface';
import { Tag } from 'src/app/shared/types/tag.type';
import { FindingsService } from '../../../api/findings/findings.service';

@Component({
  selector: 'app-view-host',
  templateUrl: './view-host.component.html',
  styleUrls: ['./view-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewHostComponent {
  public routeLoading = false;
  public hostId = '';
  dataSource = new MatTableDataSource<DomainSummary>();
  displayedColumns: string[] = ['domainName'];

  // Drawer
  public currentDetailsId: string | null = null;
  public selectedDomain: DomainSummary | null = null;
  public domainDetails$: Observable<Domain> | null = null;
  public portDetails$: Observable<Port> | null = null;
  public selectedItemCorrelationKey$ = new Subject<string | null>();

  @ViewChild(MatPaginator) paginator: MatPaginator | null;
  @ViewChild(MatDrawer) detailsDrawer: MatDrawer | null;

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

  public hostId$ = this.route.params.pipe(map((params) => params['id'] as string));

  public host$ = this.hostId$.pipe(
    switchMap((hostId) => this.hostsService.get(hostId)),
    tap((host: Host) => {
      this.routeLoading = false;
      host.ports.sort((a, b) => a.port - b.port);
      this.dataSource.data = host.domains;

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
    })
  );

  constructor(
    private route: ActivatedRoute,
    private companiesService: CompaniesService,
    private hostsService: HostsService,
    private domainsService: DomainsService,
    private tagsService: TagsService,
    private findingsService: FindingsService
  ) {
    this.paginator = null;
    this.detailsDrawer = null;
  }

  public selectDomainAndView(domain: DomainSummary) {
    if (domain == null) return;

    const previouslySelectedId = this.currentDetailsId;
    this.clearDetails();

    if (previouslySelectedId == domain.id) {
      this.detailsDrawer?.close();
      return;
    }

    this.currentDetailsId = domain.id;
    this.domainDetails$ = this.domainsService
      .get(domain.id)
      .pipe(tap((domain) => this.selectedItemCorrelationKey$.next(domain.correlationKey)));

    this.detailsDrawer?.open();
  }

  public selectPortAndView(port: Port) {
    if (port == null) return;

    const previouslySelectedId = this.currentDetailsId;
    this.clearDetails();

    if (previouslySelectedId == port.id) {
      this.detailsDrawer?.close();
      return;
    }

    this.currentDetailsId = port.id;
    this.portDetails$ = of(port);
    this.selectedItemCorrelationKey$.next(port.correlationKey);

    this.detailsDrawer?.open();
  }

  private clearDetails() {
    this.currentDetailsId = null;
    this.portDetails$ = null;
    this.domainDetails$ = null;
    this.selectedItemCorrelationKey$.next(null);
  }
}
