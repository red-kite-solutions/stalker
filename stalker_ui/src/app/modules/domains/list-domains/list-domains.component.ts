import { Component } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { Tag } from 'src/app/shared/types/tag.type';

@Component({
  selector: 'app-list-domains',
  templateUrl: './list-domains.component.html',
  styleUrls: ['./list-domains.component.scss'],
})
export class ListDomainsComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'domain', 'hosts', 'company', 'tags'];
  filterOptions: string[] = ['domain', 'company', 'tags'];

  dataSource = new MatTableDataSource<Domain>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = [];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.domainsService.getPage(currentPage.pageIndex, currentPage.pageSize, filters);
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

  count$ = this.domainsService.getCount().pipe(startWith(10));

  private generateFirstPageEvent() {
    const p = new PageEvent();
    p.pageIndex = 0;
    p.pageSize = 10;
    this.currentPage = p;
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
      if (screen === 'xs') return ['select', 'domain', 'company'];
      if (screen === 'sm') return ['select', 'domain', 'company', 'tags'];
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
    private domainsService: DomainsService,
    private toastrService: ToastrService,
    private tagsService: TagsService
  ) {}

  filtersChange(filters: string[]) {
    this.currentFilters = filters;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
    this.count$ = this.domainsService.getCount(this.buildFilters(this.currentFilters)).pipe(startWith(0));
  }

  buildFilters(stringFilters: string[]): any {
    const SEPARATOR = ':';
    const filterObject: any = {};
    const tags = [];
    const domains = [];

    for (const filter of stringFilters) {
      if (filter.indexOf(SEPARATOR) === -1) continue;

      const keyValuePair = filter.split(SEPARATOR);

      if (keyValuePair.length !== 2) continue;

      const key = keyValuePair[0].trim().toLowerCase();
      const value = keyValuePair[1].trim().toLowerCase();

      if (!key || !value) continue;

      switch (key) {
        case 'company':
          const company = this.companies.find((c) => c.name.trim().toLowerCase() === value.trim().toLowerCase());
          if (company) filterObject['company'] = company.id;
          else
            this.toastrService.warning(
              $localize`:Company does not exist|The given company name is not known to the application:Company name not recognized`
            );
          break;
        case 'tags':
          const tag = this.tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) tags.push(tag.id);
          else
            this.toastrService.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;
        case 'domain':
          domains.push(value);
          break;
      }
    }
    if (tags) filterObject['tags'] = tags;
    if (domains) filterObject['domain'] = domains;
    return filterObject;
  }
}
