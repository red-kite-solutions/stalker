import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
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
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanyCellComponent } from 'src/app/shared/components/company-cell/company-cell.component';
import { Company } from 'src/app/shared/types/company/company.interface';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { HttpStatus } from 'src/app/shared/types/http-status.type';
import { Page } from 'src/app/shared/types/page.type';
import { Tag } from 'src/app/shared/types/tag.type';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SharedModule } from '../../../shared/shared.module';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/widget/confirm-dialog/confirm-dialog.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AppHeaderComponent,
    SharedModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    CompanyCellComponent,
  ],
  selector: 'app-list-domains',
  templateUrl: './list-domains.component.html',
  styleUrls: ['./list-domains.component.scss'],
})
export class ListDomainsComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'domain', 'hosts', 'company', 'tags'];
  filterOptions: string[] = ['host', 'domain', 'company', 'tags'];

  dataSource = new MatTableDataSource<Domain>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = [];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  count = 0;
  selection = new SelectionModel<Domain>(true, []);

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.domainsService.getPage(currentPage.pageIndex, currentPage.pageSize, filters);
    }),
    map((data: Page<Domain>) => {
      this.dataSource = new MatTableDataSource<Domain>(data.items);
      this.count = data.totalRecords;
      this.dataLoading = false;
      return data;
    })
  );

  companies: Company[] = [];
  companies$ = this.companiesService.getAll().pipe(tap((x) => (this.companies = x)));

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

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: BreakpointState) => {
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'domain', 'company'];
      else if (screen.breakpoints[Breakpoints.Small]) return ['select', 'domain', 'company', 'tags'];
      else if (screen.breakpoints[Breakpoints.Medium]) return ['select', 'domain', 'hosts', 'company', 'tags'];
      return this.displayedColumns;
    })
  );

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
  }

  constructor(
    private bpObserver: BreakpointObserver,
    private companiesService: CompaniesService,
    private domainsService: DomainsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Domains list page title|:Domains`);
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
          if (company) filterObject['company'] = company._id;
          else
            this.toastr.warning(
              $localize`:Company does not exist|The given company name is not known to the application:Company name not recognized`
            );
          break;
        case 'host':
          if (value) hosts.push(value.trim().toLowerCase());
          break;
        case 'host':
          const tag = this.tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) tags.push(tag.id);
          else
            this.toastr.warning(
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
    if (hosts) filterObject['host'] = hosts;
    return filterObject;
  }

  openNewDomainsDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }

  async addNewDomains() {
    if (!this.selectedCompany) {
      this.toastr.warning($localize`:Missing company|The data selected is missing the company id:Missing company`);
      return;
    }

    if (!this.selectedNewDomains) {
      this.toastr.warning(
        $localize`:Missing domain|The data selected is missing the new domain names:Missing domain name`
      );
      return;
    }

    const newDomains: string[] = this.selectedNewDomains
      .split('\n')
      .filter((x) => x != null && x != '')
      .map((x) => x.trim());

    if (newDomains.length == 0) return;

    try {
      const addedDomains = await this.domainsService.addDomains(this.selectedCompany, newDomains);
      this.toastr.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);

      if (addedDomains.length < newDomains.length) {
        this.toastr.warning(
          $localize`:Domains not added|Some domains were not added to the database:Some domains were not added`
        );
      }

      this.dialog.closeAll();
      this.currentPage$.next(this.currentPage);
      this.selectedCompany = '';
      this.selectedNewDomains = '';
    } catch (err: any) {
      if (err.status === HttpStatus.BadRequest) {
        this.toastr.error(
          $localize`:Check domain format|Error while submitting the new domain names to the backend. Most likely a domain formatting error:Error submitting domains, check formats`
        );
      } else {
        throw err;
      }
    }
  }

  public deleteDomains() {
    const bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((domain: Domain) => {
      const companyName = this.companies.find((d) => d._id === domain.companyId)?.name;
      const bp = companyName ? `${domain.name} (${companyName})` : `${domain.name}`;
      bulletPoints.push(bp);
    });
    let data: ConfirmDialogData;
    if (bulletPoints.length > 0) {
      data = {
        text: $localize`:Confirm delete domains|Confirmation message asking if the user really wants to delete the selected domains:Do you really wish to delete these domains permanently ?`,
        title: $localize`:Deleting domains|Title of a page to delete selected domains:Deleting domains`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: bulletPoints,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async () => {
          const ids = this.selection.selected.map((d: Domain) => {
            return d._id;
          });
          await this.domainsService.deleteMany(ids);
          this.selection.clear();
          this.toastr.success(
            $localize`:Domains deleted|Confirm the successful deletion of a Domain:Domains deleted successfully`
          );
          this.currentPage$.next(this.currentPage);
          this.dialog.closeAll();
        },
      };
    } else {
      data = {
        text: $localize`:Select domains again|No domains were selected so there is nothing to delete:Select the domains to delete and try again.`,
        title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
      };
    }
    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
