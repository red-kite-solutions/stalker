import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
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
import { BehaviorSubject, catchError, combineLatest, EMPTY, map, shareReplay, switchMap, tap } from 'rxjs';
import { HostsService } from '../../../api/hosts/hosts.service';
import { PortsService } from '../../../api/ports/ports.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { ProjectCellComponent } from '../../../shared/components/project-cell/project-cell.component';
import { SharedModule } from '../../../shared/shared.module';
import { Port } from '../../../shared/types/ports/port.interface';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
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
import { appendGlobalFiltersToQuery, globalProjectFilter$ } from '../../../utils/global-project-filter';
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

  selection = new SelectionModel<Port>(true, []);
  startDate: Date | null = null;

  allTags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  private refresh$ = new BehaviorSubject(null);
  public ports$ = combineLatest([this.filtersSource.debouncedFilters$, this.refresh$, globalProjectFilter$]).pipe(
    tap((x) => console.log(x)),
    switchMap(([{ filters, dateRange, pagination }]) =>
      this.portsService
        .getPage<Port>(
          pagination?.page ?? 0,
          pagination?.pageSize ?? 25,
          appendGlobalFiltersToQuery(filters[0]),
          dateRange,
          'extended'
        )
        .pipe(catchError(() => EMPTY))
    ),
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
  projects$ = this.projectsService.getAllSummaries().pipe(tap((x) => (this.projects = x)));

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: BreakpointState) => {
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'port', 'ip', 'project', 'menu'];
      else if (screen.breakpoints[Breakpoints.Small])
        return ['select', 'port', 'ip', 'domains', 'project', 'tags', 'menu'];
      else if (screen.breakpoints[Breakpoints.Medium])
        return ['select', 'port', 'ip', 'domains', 'project', 'tags', 'menu'];
      return this.displayedColumns;
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
    private hostsService: HostsService,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Ports list page title|:Ports`);
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
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete port|Delete port:Delete`,
    });

    return menuItems;
  };
}
