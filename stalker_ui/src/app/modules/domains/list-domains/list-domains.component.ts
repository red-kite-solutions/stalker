import { Component } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';

@Component({
  selector: 'app-list-domains',
  templateUrl: './list-domains.component.html',
  styleUrls: ['./list-domains.component.scss'],
})
export class ListDomainsComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'domain', 'hosts', 'company', 'tags'];

  dataSource = new MatTableDataSource<Domain>();
  firstPage: PageEvent = this.generateFirstPageEvent();
  currentPage$ = new BehaviorSubject<PageEvent>(this.firstPage);
  dataSource$ = this.currentPage$.pipe(
    switchMap((currentPage) => {
      return this.domainsService.getPage(currentPage.pageIndex, currentPage.pageSize);
    }),
    map((data: Domain[]) => {
      if (!this.dataSource) {
        this.dataSource = new MatTableDataSource<Domain>();
      }
      this.dataSource.data = data;
      this.dataLoading = false;
      return data;
    })
  );

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

  count$ = this.domainsService.getCount().pipe(startWith(10));

  private generateFirstPageEvent() {
    const p = new PageEvent();
    p.pageIndex = 0;
    p.pageSize = 10;
    return p;
  }

  private screenSize$ = this.mediaObserver.asObservable().pipe(
    filter((mediaChanges: MediaChange[]) => !!mediaChanges[0].mqAlias),
    distinctUntilChanged((previous: MediaChange[], current: MediaChange[]) => {
      return previous[0].mqAlias === current[0].mqAlias;
    }),
    map((mediaChanges: MediaChange[]) => {
      return mediaChanges[0].mqAlias;
    })
  );

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: string) => {
      if (screen === 'xs') return ['select', 'domain', 'hosts', 'company', 'tags'];
      if (screen === 'sm') return ['select', 'domain', 'hosts', 'company', 'tags'];
      if (screen === 'md') return ['select', 'domain', 'hosts', 'company', 'tags'];
      return this.displayedColumns;
    })
  );

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
  }

  constructor(
    private mediaObserver: MediaObserver,
    private companiesService: CompaniesService,
    private domainsService: DomainsService
  ) {}
}
