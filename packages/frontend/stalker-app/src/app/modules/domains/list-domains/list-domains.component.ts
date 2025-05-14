import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, Inject, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DateRange } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, catchError, combineLatest, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { DomainsService } from '../../../api/domains/domains.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { ProjectCellComponent } from '../../../shared/components/project-cell/project-cell.component';
import { HasScopesDirective } from '../../../shared/directives/has-scopes.directive';
import { SharedModule } from '../../../shared/shared.module';
import { Domain } from '../../../shared/types/domain/domain.interface';
import { HttpStatus } from '../../../shared/types/http-status.type';
import { Page } from '../../../shared/types/page.type';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { Tag } from '../../../shared/types/tag.type';
import { ElementMenuItems } from '../../../shared/widget/dynamic-icons/menu-icon.component';
import { FilteredPaginatedTableComponent } from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import {
  TABLE_FILTERS_SOURCE_INITAL_FILTERS,
  TableFilters,
  TableFiltersSource,
  TableFiltersSourceBase,
} from '../../../shared/widget/filtered-paginated-table/table-filters-source';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { BlockedPillTagComponent } from '../../../shared/widget/pill-tag/blocked-pill-tag.component';
import { defaultNewTimeMs } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { PillTagComponent } from '../../../shared/widget/pill-tag/pill-tag.component';
import {
  getGlobalProjectFilter,
  globalProjectFilter$,
  hasGlobalProjectFilter,
} from '../../../utils/global-project-filter';
import { DomainsInteractionsService } from '../domains-interactions.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
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
    PillTagComponent,
    HasScopesDirective,
  ],
  selector: 'app-list-domains',
  templateUrl: './list-domains.component.html',
  styleUrls: ['./list-domains.component.scss'],
  providers: [
    { provide: TableFiltersSourceBase, useClass: TableFiltersSource },
    {
      provide: TABLE_FILTERS_SOURCE_INITAL_FILTERS,
      useValue: {
        filters: ['-is: blocked'],
        pagination: { page: 0, pageSize: 25 },
      } as TableFilters,
    },
  ],
})
export class ListDomainsComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'domain', 'hosts', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['host', 'domain', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No domain found|No domain was found:No domain found`;

  maxHostsPerLine = 5;
  count = 0;
  selection = new SelectionModel<Domain>(true, []);
  startDate: Date | null = null;

  projects$ = this.projectsService.getAllSummaries().pipe(
    catchError((err) => of([])),
    shareReplay(1)
  );
  tags$ = this.tagsService.getAllTags().pipe(
    catchError((err) => of([])),
    shareReplay(1)
  );

  private refresh$ = new BehaviorSubject(null);
  dataSource$ = combineLatest([
    this.filtersSource.debouncedFilters$,
    this.projects$,
    this.tags$,
    this.refresh$,
    globalProjectFilter$,
  ]).pipe(
    switchMap(([{ dateRange, filters, pagination }, projects, tags]) => {
      return this.domainsService.getPage(
        pagination?.page || 0,
        pagination?.pageSize || 25,
        this.buildFilters(filters || [], projects, tags),
        dateRange ?? new DateRange<Date>(null, null)
      );
    }),
    map((data: Page<Domain>) => {
      this.count = data.totalRecords;
      this.dataLoading = false;
      return new MatTableDataSource<Domain>(data.items);
    })
  );

  // #addDomainDialog template variables
  selectedProject = '';
  selectedNewDomains = '';

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public displayColumns$ = combineLatest([this.tags$, this.projects$]).pipe(
    map(([tags, projects]) => {
      let cols = this.displayedColumns;
      if (!tags.length) cols = cols.filter((c) => c !== 'tags');

      if (!projects || !projects.length) cols = cols.filter((c) => c !== 'project');

      return cols;
    })
  );

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private domainsService: DomainsService,
    private domainsInteractor: DomainsInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Domains list page title|:Domains`);
  }

  buildFilters(stringFilters: string[], projects: ProjectSummary[], tags: Tag[]): any {
    const SEPARATOR = ':';
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const includedTags = [];
    const includedDomains = [];
    const includedHosts = [];
    const includedProjects = [];
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
          const project = projects.find((c) => c.name.trim().toLowerCase() === value.trim().toLowerCase());
          if (project) includedProjects.push(project.id);
          else
            this.toastr.warning(
              $localize`:Project does not exist|The given project name is not known to the application:Project name not recognized`
            );
          break;

        case 'host':
          if (value) includedHosts.push(value.trim().toLowerCase());
          break;

        case 'tags':
          const tag = tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) includedTags.push(tag._id);
          else
            this.toastr.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;

        case 'domain':
          includedDomains.push(value);
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

    if (hasGlobalProjectFilter()) includedProjects.push(getGlobalProjectFilter()?.id);

    if (includedTags.length) filterObject['tags'] = includedTags;
    if (includedDomains.length) filterObject['domains'] = includedDomains;
    if (includedHosts.length) filterObject['hosts'] = includedHosts;
    if (includedProjects.length) filterObject['projects'] = includedProjects;
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
          $localize`:Domains duplicates|Some domains were duplicates to the database:Some domains were duplicates`
        );
      }

      this.dialog.closeAll();
      this.refresh$.next(null);
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
    const projects = await firstValueFrom(this.projects$);
    const result = await this.domainsInteractor.deleteBatch(domains, projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async blockBatch(domains: Domain[]) {
    const projects = await firstValueFrom(this.projects$);
    const result = await this.domainsInteractor.blockBatch(domains, projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async block(domainId: string, block: boolean) {
    const result = await this.domainsInteractor.block(domainId, block);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
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
      requiredScopes: ['resources:domains:update'],
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete domain|Delete domain:Delete`,
      requiredScopes: ['resources:domains:delete'],
    });

    return menuItems;
  };
}
