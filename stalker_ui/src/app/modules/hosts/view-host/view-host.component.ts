import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
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
  selector: 'app-view-host',
  templateUrl: './view-host.component.html',
  styleUrls: ['./view-host.component.scss'],
})
export class ViewHostComponent {
  public routeLoading = false;
  public hostId = '';
  public host: Host | null = null;
  dataSource = new MatTableDataSource<DomainSummary>();
  displayedColumns: string[] = ['domainName'];

  // Domain drawer
  public selectedDomain: DomainSummary | null = null;
  public domainDetails: Domain | null = null;
  public domainDetails$: Observable<Domain> | null = null;
  public domainsHostDataSource = new MatTableDataSource<HostSummary>();

  @ViewChild(MatPaginator) paginator: MatPaginator | null;
  @ViewChild(MatDrawer) domainDrawer: MatDrawer | null;

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
        host.ports.sort((a, b) => a - b);
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
    private tagsService: TagsService
  ) {
    this.paginator = null;
    this.domainDrawer = null;
  }

  public selectDomainAndView(domainSummary: DomainSummary) {
    const previousSelection = this.selectedDomain;
    this.selectedDomain = domainSummary;

    if (previousSelection && previousSelection.id === this.selectedDomain.id) {
      this.domainDrawer?.close();
      this.selectedDomain = null;
      return;
    }

    if (!previousSelection) {
      this.domainDrawer?.open();
    }

    this.domainDetails$ = this.domainsService.get(this.selectedDomain.id).pipe(
      map((dd: Domain) => {
        this.domainDetails = dd;
        this.domainsHostDataSource.data = dd.hosts;
        return dd;
      })
    );
  }
}
