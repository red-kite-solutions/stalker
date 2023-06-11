import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Page } from 'src/app/shared/types/page.type';
import { Tag } from 'src/app/shared/types/tag.type';
import { HostsService } from '../../../api/hosts/hosts.service';
import { SharedModule } from '../../../shared/shared.module';
import { Host } from '../../../shared/types/host/host.interface';
import { HttpStatus } from '../../../shared/types/http-status.type';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    SharedModule,
    FormsModule,
    MatButtonModule,
    MatTableModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  selector: 'app-list-hosts',
  templateUrl: './list-hosts.component.html',
  styleUrls: ['./list-hosts.component.scss'],
})
export class ListHostsComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'ip', 'domains', 'company', 'tags'];
  filterOptions: string[] = ['host', 'domain', 'company', 'tags'];

  dataSource = new MatTableDataSource<Host>();
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
      return this.hostsService.getPage(currentPage.pageIndex, currentPage.pageSize, filters);
    }),
    map((data: Page<Host>) => {
      if (!this.dataSource) {
        this.dataSource = new MatTableDataSource<Host>();
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

  // #addHostsDialog template variables
  selectedCompany = '';
  selectedNewHosts = '';

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
      if (screen === 'xs') return ['select', 'ip', 'company'];
      if (screen === 'sm') return ['select', 'ip', 'company', 'tags'];
      if (screen === 'md') return ['select', 'ip', 'domains', 'company', 'tags'];
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
    private hostsService: HostsService,
    private toasts: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Hosts list page title|:Hosts`);
  }

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
    const hosts = [];

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
            this.toasts.warning(
              $localize`:Company does not exist|The given company name is not known to the application:Company name not recognized`
            );
          break;
        case 'host':
          if (value) hosts.push(value.trim().toLowerCase());
          break;
        case 'tags':
          const tag = this.tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) tags.push(tag.id);
          else
            this.toasts.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;
        case 'domain':
          domains.push(value);
          break;
      }
    }
    if (tags?.length) filterObject['tags'] = tags;
    if (domains?.length) filterObject['domain'] = domains;
    if (hosts?.length) filterObject['host'] = hosts;
    return filterObject;
  }

  openNewHostsDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }

  async addNewHosts() {
    if (!this.selectedCompany) {
      this.toasts.warning($localize`:Missing company|The data selected is missing the company id:Missing company`);
      return;
    }

    if (!this.selectedNewHosts) {
      this.toasts.warning(
        $localize`:Missing domain|The data selected is missing the new domain names:Missing domain name`
      );
      return;
    }

    const newHosts: string[] = this.selectedNewHosts
      .split('\n')
      .filter((x) => x != null && x != '')
      .map((x) => x.trim());

    if (newHosts.length == 0) return;

    try {
      const addedDomains = await this.hostsService.addHosts(this.selectedCompany, newHosts);

      this.toasts.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);

      if (addedDomains.length < newHosts.length) {
        this.toasts.warning(
          $localize`:Hosts  not added|Some hosts were not added to the database:Some hosts were not added`
        );
      }

      this.dialog.closeAll();
      this.currentPage$.next(this.currentPage);
      this.selectedCompany = '';
      this.selectedNewHosts = '';
    } catch (err: any) {
      if (err.status === HttpStatus.BadRequest) {
        this.toasts.error(
          $localize`:Check host format|Error while submitting the new hosts to the backend. Most likely a host formatting error:Error submitting hosts, check formats`
        );
      } else {
        throw err;
      }
    }
  }
}
