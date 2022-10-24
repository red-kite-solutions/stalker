import { Component, TemplateRef } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { HttpStatus } from 'src/app/shared/types/http-status.type';
import { Page } from 'src/app/shared/types/page.type';
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
  count = 0;

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.domainsService.getPage(currentPage.pageIndex, currentPage.pageSize, filters);
    }),
    map((data: Page<Domain>) => {
      if (!this.dataSource) {
        this.dataSource = new MatTableDataSource<Domain>();
      }
      this.dataSource.data = data.items;
      this.count = data.totalRecords;
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

  // #addDomainDialog template variables
  selectedCompany = '';
  selectedNewDomains = '';

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
    private tagsService: TagsService,
    public dialog: MatDialog
  ) {}

  filtersChange(filters: string[]) {
    this.currentFilters = filters;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
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

  openNewDomainsDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }

  async addNewDomains() {
    if (!this.selectedCompany || !this.selectedNewDomains) {
      this.toastrService.warning(
        $localize`:Missing company or domain|The data selected is missing the company id or the new domain names:Missing company or domain name`
      );
      return;
    }

    const potentialNewDomains: string[] = this.selectedNewDomains.split('\n');
    const newDomains: string[] = [];
    for (const domain of potentialNewDomains) {
      if (domain) {
        newDomains.push(domain.trim());
      }
    }

    if (newDomains.length > 0) {
      try {
        const addedDomains = await this.domainsService.addDomains(this.selectedCompany, newDomains);

        this.toastrService.success(
          $localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`
        );

        if (addedDomains.length < newDomains.length) {
          const domainsNotAdded = [];
          for (const domain of newDomains) {
            if (!addedDomains.find((value) => value.name === domain)) {
              domainsNotAdded.push(domain);
            }
          }
          console.log('Domains not added: ');
          console.log(domainsNotAdded);
          this.toastrService.warning(
            $localize`:Domains not added|Some domains were not added to the database:Some domains did not add properly`
          );
        }

        this.dialog.closeAll();
        this.currentPage$.next(this.currentPage);
        this.selectedCompany = '';
        this.selectedNewDomains = '';
      } catch (err: any) {
        if (err.status === HttpStatus.BadRequest) {
          this.toastrService.error(
            $localize`:Check domain format|Error while submitting the new domain names to the backend. Most likely a domain formatting error:Error submitting domains, check formats`
          );
        } else {
          throw err;
        }
      }
    }
  }
}