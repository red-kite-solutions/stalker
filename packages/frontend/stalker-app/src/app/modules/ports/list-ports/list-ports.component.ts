import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, catchError, combineLatest, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { PortsService } from '../../../api/ports/ports.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { ProjectCellComponent } from '../../../shared/components/project-cell/project-cell.component';
import { HasScopesDirective } from '../../../shared/directives/has-scopes.directive';
import { SharedModule } from '../../../shared/shared.module';
import { DomainSummary } from '../../../shared/types/domain/domain.summary';
import { ExtendedPort, Port } from '../../../shared/types/ports/port.interface';
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
import { PortsInteractionsService } from '../ports-interactions.service';

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
    ProjectCellComponent,
    FilteredPaginatedTableComponent,
    RouterModule,
    BlockedPillTagComponent,
    TableFormatComponent,
    PillTagComponent,
    HasScopesDirective,
  ],
  selector: 'app-list-ports',
  templateUrl: './list-ports.component.html',
  styleUrls: ['./list-ports.component.scss'],
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
export class ListPortsComponent {
  dataLoading = true;
  displayedColumns: string[] = [
    'select',
    'port',
    'service',
    'product',
    'version',
    'ip',
    'domains',
    'project',
    'tags',
    'menu',
  ];
  filterOptions: string[] = ['host', 'port', 'service', 'product', 'version', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No port found|No port was found:No port found`;

  selection = new SelectionModel<Port & { domains: DomainSummary[] }>(true, []);
  startDate: Date | null = null;

  allTags$ = this.tagsService.getAllTags().pipe(
    shareReplay(1),
    catchError((err) => of([]))
  );

  private refresh$ = new BehaviorSubject(null);
  public ports$ = combineLatest([
    this.filtersSource.debouncedFilters$,
    this.allTags$,
    this.refresh$,
    globalProjectFilter$,
  ]).pipe(
    switchMap(([{ filters, dateRange, pagination }, tags]) => {
      return this.portsService.getPage<ExtendedPort>(
        pagination?.page ?? 0,
        pagination?.pageSize ?? 25,
        this.buildFilters(filters, tags),
        dateRange,
        'extended'
      );
    }),
    shareReplay(1)
  );

  dataSource$ = this.ports$.pipe(
    tap(() => {
      this.dataLoading = false;
    }),
    map((page) => new MatTableDataSource(page.items)),
    shareReplay(1)
  );

  maxDomainsPerHost = 35;

  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(
    catchError((err) => of([])),
    tap((x) => (this.projects = x)),
    shareReplay(1)
  );

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public displayColumns$ = combineLatest([this.allTags$, this.projects$]).pipe(
    map(([tags, projects]) => {
      let cols = this.displayedColumns;
      if (!tags.length) cols = cols.filter((c) => c !== 'tags');

      if (!projects || !projects.length) cols = cols.filter((c) => c !== 'project');

      if (!this.authService.userHasScope('resources:domains:read')) cols = cols.filter((c) => c !== 'domains');

      return cols;
    })
  );

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private portsService: PortsService,
    private portsInteractor: PortsInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title,
    private authService: AuthService,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Ports list page title|:Ports`);
  }

  buildFilters(stringFilters: string[], tags: Tag[]): any {
    const SEPARATOR = ':';
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const includedTags = [];
    const ports = [];
    const hosts = [];
    const services: string[] = [];
    const products: string[] = [];
    const versions: string[] = [];
    const projects = [];
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
          if (project) projects.push(project.id);
          else
            this.toastr.warning(
              $localize`:Project does not exist|The given project name is not known to the application:Project name not recognized`
            );
          break;
        case 'host':
          if (value) hosts.push(value.trim().toLowerCase());
          break;
        case 'service':
          if (value) services.push(value.trim().toLowerCase());
          break;
        case 'product':
          if (value) products.push(value.trim().toLowerCase());
          break;
        case 'version':
          if (value) versions.push(value.trim().toLowerCase());
          break;
        case 'tags':
          const tag = tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) includedTags.push(tag._id);
          else
            this.toastr.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;
        case 'port':
          ports.push(value);
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

    if (hasGlobalProjectFilter()) projects.push(getGlobalProjectFilter()?.id);

    if (includedTags?.length) filterObject['tags'] = includedTags;
    if (ports?.length) filterObject['ports'] = ports;
    if (hosts?.length) filterObject['hosts'] = hosts;
    if (projects?.length) filterObject['projects'] = projects;
    if (services?.length) filterObject['services'] = services;
    if (products?.length) filterObject['products'] = products;
    if (versions?.length) filterObject['versions'] = versions;
    if (blocked !== null) filterObject['blocked'] = blocked;
    return filterObject;
  }

  dateFilter(event: MouseEvent) {
    event.stopPropagation();
    this.startDate = new Date(Date.now() - defaultNewTimeMs);
  }

  routerLinkBuilder(row: Port): string[] {
    return ['/hosts', row.host.id, 'ports', row.port.toString()];
  }

  public async deleteBatch(domains: Port[]) {
    const result = await this.portsInteractor.deleteBatch(domains, this.projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async blockBatch(domains: Port[]) {
    const result = await this.portsInteractor.blockBatch(domains, this.projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async block(domainId: string, block: boolean) {
    const result = await this.portsInteractor.block(domainId, block);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public generateMenuItem = (element: Port): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.block(element._id, !element.blocked),
      icon: element.blocked ? 'thumb_up ' : 'block',
      label: element.blocked ? $localize`:Unblock port|Unblock port:Unblock` : $localize`:Block port|Block port:Block`,
      requiredScopes: ['resources:ports:update'],
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete port|Delete port:Delete`,
      requiredScopes: ['resources:ports:delete'],
    });

    return menuItems;
  };
}
