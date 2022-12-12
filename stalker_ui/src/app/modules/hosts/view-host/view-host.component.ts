import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, concatMap, map, Observable, of, scan, shareReplay, switchMap, tap } from 'rxjs';
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
import { Finding } from '../../../shared/types/finding/finding.type';
import { Page } from '../../../shared/types/page.type';

@Component({
  selector: 'app-view-host',
  templateUrl: './view-host.component.html',
  styleUrls: ['./view-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewHostComponent {
  public routeLoading = false;
  public hostId = '';
  public host: Host | null = null;
  dataSource = new MatTableDataSource<DomainSummary>();
  displayedColumns: string[] = ['domainName'];

  // Drawer
  public currentDetailsId: string | null = null;
  public selectedDomain: DomainSummary | null = null;
  public domainDetails$: Observable<Domain> | null = null;
  public portDetails$: Observable<Port> | null = null;
  public loadMoreFindings$: BehaviorSubject<null> = new BehaviorSubject(null);
  public isLoadingMoreFindings$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public selectedItemFindings$: Observable<Page<Finding>> | null = null;

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

  public routeSub$ = this.route.params
    .pipe(
      switchMap((params) => {
        this.routeLoading = true;
        this.hostId = params['id'];
        return this.hostsService.get(this.hostId);
      })
    )
    .pipe(
      map((host: Host) => {
        this.routeLoading = false;
        host.ports.sort((a, b) => a.port - b.port);
        this.host = host;
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
    this.domainDetails$ = this.domainsService.get(domain.id);
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
    this.loadMoreFindings$ = new BehaviorSubject(null);
    this.selectedItemFindings$ = this.loadMoreFindings$.pipe(
      tap(() => this.isLoadingMoreFindings$.next(true)),
      scan((acc) => acc + 1, 0),
      concatMap((page) => this.findingsService.getFindings(port.findingsCorrelationKey, page, 15)),
      scan((acc, value) => {
        acc.items.push(...value.items);
        acc.totalRecords = value.totalRecords;
        return acc;
      }),
      tap(() => this.isLoadingMoreFindings$.next(false)),
      shareReplay(1)
    );

    this.detailsDrawer?.open();
  }

  public loadMoreFindings() {
    this.loadMoreFindings$.next(null);
  }

  private clearDetails() {
    this.currentDetailsId = null;
    this.portDetails$ = null;
    this.domainDetails$ = null;
    this.selectedItemFindings$ = null;
  }
}
