import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { Host } from 'src/app/shared/types/host/host.interface';
import { HostSummary } from 'src/app/shared/types/host/host.summary';

@Component({
  selector: 'app-view-domain',
  templateUrl: './view-domain.component.html',
  styleUrls: ['./view-domain.component.scss'],
})
export class ViewDomainComponent {
  public routeLoading = false;
  public domainId = '';
  public domain: Domain | null = null;
  dataSource = new MatTableDataSource<HostSummary>();
  displayedColumns: string[] = ['ipAddress', 'ports'];
  public selectedHost: HostSummary | null = null;
  public hostDetails: Host | null = null;
  public hostDetails$: Observable<Host> | null = null;
  @ViewChild(MatPaginator) paginator: MatPaginator | null;
  @ViewChild(MatDrawer) hostDrawer: MatDrawer | null;

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
        // this.dataSource.data = domain.hosts;
        this.dataSource.data = [
          { ip: '11.11.111.111', id: 'myid1' },
          { ip: '222.222.222.222', id: 'myid2' },
          { ip: '3.33.33.3', id: 'myid3' },
          { ip: '44.4.4.4', id: 'myid4' },
          { ip: '5.5.5.5', id: 'myid5' },
        ];
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
    private domainsService: DomainsService,
    private hostsService: HostsService
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

    // this.hostDetails$ = this.hostsService.get(this.selectedHost.id);
  }
}
