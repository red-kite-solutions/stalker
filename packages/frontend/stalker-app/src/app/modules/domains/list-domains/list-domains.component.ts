import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DateRange } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { ProjectsService } from 'src/app/api/projects/projects.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { ProjectCellComponent } from 'src/app/shared/components/project-cell/project-cell.component';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { HttpStatus } from 'src/app/shared/types/http-status.type';
import { Page } from 'src/app/shared/types/page.type';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import { Tag } from 'src/app/shared/types/tag.type';
import {
  ElementMenuItems,
  FilteredPaginatedTableComponent,
} from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { BlockedPillTagComponent } from 'src/app/shared/widget/pill-tag/blocked-pill-tag.component';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SharedModule } from '../../../shared/shared.module';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { defaultNewTimeMs } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { DomainsInteractionsService } from '../domains-interactions.service';

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
    ProjectCellComponent,
    FilteredPaginatedTableComponent,
    RouterModule,
    BlockedPillTagComponent,
    TableFormatComponent,
  ],
  selector: 'app-list-domains',
  templateUrl: './list-domains.component.html',
  styleUrls: ['./list-domains.component.scss'],
})
export class ListDomainsComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'domain', 'hosts', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['host', 'domain', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No domain found|No domain was found:No domain found`;

  maxHostsPerLine = 5;
  dataSource = new MatTableDataSource<Domain>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = ['-is: blocked'];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  count = 0;
  selection = new SelectionModel<Domain>(true, []);
  currentDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  startDate: Date | null = null;

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.domainsService.getPage(currentPage.pageIndex, currentPage.pageSize, filters, this.currentDateRange);
    }),
    map((data: Page<Domain>) => {
      this.dataSource = new MatTableDataSource<Domain>(data.items);
      this.count = data.totalRecords;
      this.dataLoading = false;
      return data;
    })
  );

  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(tap((x) => (this.projects = x)));

  tags: Tag[] = [];
  tags$ = this.tagsService.getTags().pipe(
    map((next: any[]) => {
      const tagsArr: Tag[] = [];
      for (const tag of next) {
        tagsArr.push({ _id: tag._id, text: tag.text, color: tag.color });
      }
      this.tags = tagsArr;
      return this.tags;
    })
  );

  // #addDomainDialog template variables
  selectedProject = '';
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
      // if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'domain', 'project', 'menu'];
      // else if (screen.breakpoints[Breakpoints.Small]) return ['select', 'domain', 'project', 'tags', 'menu'];
      // else if (screen.breakpoints[Breakpoints.Medium]) return ['select', 'domain', 'hosts', 'project', 'tags', 'menu'];
      return this.displayedColumns;
    })
  );

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
  }

  dateRangeFilterChange(range: DateRange<Date>) {
    this.currentDateRange = range;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
  }

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private domainsService: DomainsService,
    private domainsInteractor: DomainsInteractionsService,
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
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const tags = [];
    const domains = [];
    const hosts = [];
    let blocked: boolean | null = null;

    for (const filter of stringFilters) {
      if (filter.indexOf(SEPARATOR) === -1) continue;

      const keyValuePair = filter.split(SEPARATOR);

      if (keyValuePair.length !== 2) continue;

      let key = keyValuePair[0].trim().toLowerCase();
      const value = keyValuePair[1].trim().toLowerCase();
      const negated = key.length > 0 && key[0] === NEGATING_CHAR;
      if (negated) key = key.substring(1);

      if (!key || !value) continue;

      switch (key) {
        case 'project':
          const project = this.projects.find((c) => c.name.trim().toLowerCase() === value.trim().toLowerCase());
          if (project) filterObject['project'] = project.id;
          else
            this.toastr.warning(
              $localize`:Project does not exist|The given project name is not known to the application:Project name not recognized`
            );
          break;
        case 'host':
          if (value) hosts.push(value.trim().toLowerCase());
          break;
        case 'tags':
          const tag = this.tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) tags.push(tag._id);
          else
            this.toastr.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;
        case 'domain':
          domains.push(value);
          break;
        case 'is':
          switch (value) {
            case 'blocked':
              blocked = !negated;
              break;
          }
          break;
      }
    }
    if (tags) filterObject['tags'] = tags;
    if (domains) filterObject['domain'] = domains;
    if (hosts) filterObject['host'] = hosts;
    if (blocked !== null) filterObject['blocked'] = blocked;
    return filterObject;
  }

  openNewDomainsDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }

  async addNewDomains() {
    if (!this.selectedProject) {
      this.toastr.warning($localize`:Missing project|The data selected is missing the project id:Missing project`);
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
      const addedDomains = await this.domainsService.addDomains(this.selectedProject, newDomains);
      this.toastr.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);

      if (addedDomains.length < newDomains.length) {
        this.toastr.warning(
          $localize`:Domains not added|Some domains were not added to the database:Some domains were not added`
        );
      }

      this.dialog.closeAll();
      this.currentPage$.next(this.currentPage);
      this.selectedProject = '';
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

  public async deleteBatch(domains: Domain[]) {
    const result = await this.domainsInteractor.deleteBatch(domains, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public async blockBatch(domains: Domain[]) {
    const result = await this.domainsInteractor.blockBatch(domains, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public async block(domainId: string, block: boolean) {
    const result = await this.domainsInteractor.block(domainId, block);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  dateFilter(event: MouseEvent) {
    event.stopPropagation();
    this.startDate = new Date(Date.now() - defaultNewTimeMs);
  }

  public generateMenuItem = (element: Domain): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.block(element._id, !element.blocked),
      icon: element.blocked ? 'thumb_up ' : 'block',
      label: element.blocked
        ? $localize`:Unblock domain|Unblock domain:Unblock`
        : $localize`:Block domain|Block domain:Block`,
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete domain|Delete domain:Delete`,
    });

    return menuItems;
  };
}
