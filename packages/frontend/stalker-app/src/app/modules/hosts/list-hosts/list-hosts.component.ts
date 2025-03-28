import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
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
import { BehaviorSubject, combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';
import { HostsService } from '../../../api/hosts/hosts.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { ProjectCellComponent } from '../../../shared/components/project-cell/project-cell.component';
import { SharedModule } from '../../../shared/shared.module';
import { Host } from '../../../shared/types/host/host.interface';
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
import { HostsInteractionsService } from '../hosts-interactions.service';

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
    BlockedPillTagComponent,
    RouterModule,
    TableFormatComponent,
    PillTagComponent,
  ],
  selector: 'app-list-hosts',
  templateUrl: './list-hosts.component.html',
  styleUrls: ['./list-hosts.component.scss'],
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
export class ListHostsComponent {
  maxDomainsPerHost = 35;
  dataLoading = true;
  displayedColumns: string[] = ['select', 'ip', 'domains', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['host', 'domain', 'range', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No host found|No host was found:No host found`;

  count = 0;
  selection = new SelectionModel<Host>(true, []);
  startDate: Date | null = null;

  tags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  private refresh$ = new BehaviorSubject(null);
  dataSource$ = combineLatest([
    this.filtersSource.debouncedFilters$,
    this.tags$,
    this.refresh$,
    globalProjectFilter$,
  ]).pipe(
    switchMap(([{ dateRange, filters, pagination }, tags]) => {
      return this.hostsService.getPage(
        pagination?.page || 0,
        pagination?.pageSize || 25,
        this.buildFilters(filters || [], tags),
        dateRange ?? new DateRange<Date>(null, null)
      );
    }),
    map((data: Page<Host>) => {
      this.count = data.totalRecords;
      this.dataLoading = false;
      return new MatTableDataSource<Host>(data.items);
    })
  );

  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(tap((x) => (this.projects = x)));

  // #addHostsDialog template variables
  selectedProject = '';
  selectedNewHosts = '';

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: BreakpointState) => {
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'ip', 'project', 'menu'];
      else if (screen.breakpoints[Breakpoints.Small]) return ['select', 'ip', 'project', 'tags', 'menu'];
      else if (screen.breakpoints[Breakpoints.Medium]) return ['select', 'ip', 'domains', 'project', 'tags', 'menu'];
      return this.displayedColumns;
    })
  );

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private hostsService: HostsService,
    private hostsInteractor: HostsInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Hosts list page title|:Hosts`);
  }

  buildFilters(stringFilters: string[], tags: Tag[]): any {
    const SEPARATOR = ':';
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const includedTags = [];
    const domains = [];
    const ranges = [];
    const hosts = [];
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
        case 'tags':
          const tag = tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) includedTags.push(tag._id);
          else
            this.toastr.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;
        case 'domain':
          domains.push(value);
          break;
        case 'range':
          ranges.push(value);
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
    if (domains?.length) filterObject['domains'] = domains;
    if (hosts?.length) filterObject['hosts'] = hosts;
    if (ranges?.length) filterObject['ranges'] = ranges;
    if (projects?.length) filterObject['projects'] = projects;
    if (blocked !== null) filterObject['blocked'] = blocked;
    return filterObject;
  }

  openNewHostsDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }

  async addNewHosts() {
    if (!this.selectedProject) {
      this.toastr.warning($localize`:Missing project|The data selected is missing the project id:Missing project`);
      return;
    }

    if (!this.selectedNewHosts) {
      this.toastr.warning($localize`:Missing host|The data selected is missing the new hosts:Missing host IPs`);
      return;
    }

    const newHosts: string[] = this.selectedNewHosts
      .split('\n')
      .filter((x) => x != null && x != '')
      .map((x) => x.trim());

    if (newHosts.length == 0) return;

    try {
      const addedHosts = await this.hostsService.addHosts(this.selectedProject, newHosts);
      this.toastr.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);

      if (addedHosts.length < newHosts.length) {
        this.toastr.warning(
          $localize`:Hosts duplicates|Some hosts were duplicates to the database:Some hosts were duplicates`
        );
      }

      this.dialog.closeAll();
      this.refresh$.next(null);
      this.selectedProject = '';
      this.selectedNewHosts = '';
    } catch (err: any) {
      if (err.status === HttpStatus.BadRequest) {
        this.toastr.error(
          $localize`:Check host format|Error while submitting the new hosts to the backend. Most likely a host formatting error:Error submitting hosts, check formats`
        );
      } else {
        throw err;
      }
    }
  }

  dateFilter(event: MouseEvent) {
    event.stopPropagation();
    this.startDate = new Date(Date.now() - defaultNewTimeMs);
  }

  public async deleteBatch(hosts: Host[]) {
    const result = await this.hostsInteractor.deleteBatch(hosts, this.projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async blockBatch(hosts: Host[]) {
    const result = await this.hostsInteractor.blockBatch(hosts, this.projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async block(hostId: string, block: boolean) {
    const result = await this.hostsInteractor.block(hostId, block);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public generateMenuItem = (element: Host): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.block(element._id, !element.blocked),
      icon: element.blocked ? 'thumb_up ' : 'block',
      label: element.blocked ? $localize`:Unblock host|Unblock host:Unblock` : $localize`:Block host|Block host:Block`,
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete host|Delete host:Delete`,
    });

    return menuItems;
  };
}
