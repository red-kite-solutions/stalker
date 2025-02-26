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
import { IpRangesService } from '../../../api/ip-ranges/ip-ranges.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { IpRangeAccordionComponent } from '../../../shared/components/ip-range-accordion/ip-range-accordion.component';
import { ProjectCellComponent } from '../../../shared/components/project-cell/project-cell.component';
import { SharedModule } from '../../../shared/shared.module';
import { HttpStatus } from '../../../shared/types/http-status.type';
import { IpRange } from '../../../shared/types/ip-range/ip-range.interface';
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
import {
  getGlobalProjectFilter,
  globalProjectFilter$,
  hasGlobalProjectFilter,
} from '../../../utils/global-project-filter';
import { IpRangesInteractionsService } from '../ip-ranges-interactions.service';

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
    IpRangeAccordionComponent,
  ],
  selector: 'app-list-ip-ranges',
  templateUrl: './list-ip-ranges.component.html',
  styleUrls: ['./list-ip-ranges.component.scss'],
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
export class ListIpRangesComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'cidr', 'hosts', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['ip', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No ip range found|No ip range was found:No ip range found`;
  public newIpRanges: Pick<IpRange, 'ip' | 'mask'>[] = [];

  maxHostsPerLine = 5;
  count = 0;
  selection = new SelectionModel<IpRange>(true, []);
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
      return this.ipRangesService.getPage(
        pagination?.page || 0,
        pagination?.pageSize || 25,
        this.buildFilters(filters || [], tags),
        dateRange ?? new DateRange<Date>(null, null)
      );
    }),
    map((data: Page<IpRange>) => {
      this.count = data.totalRecords;
      this.dataLoading = false;
      return new MatTableDataSource<IpRange>(data.items);
    })
  );

  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(tap((x) => (this.projects = x)));

  // #addIpRangesDialog template variables
  selectedProject = '';

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: BreakpointState) => {
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'cidr', 'hosts', 'project', 'menu'];
      else if (screen.breakpoints[Breakpoints.Small]) return ['select', 'cidr', 'hosts', 'project', 'tags', 'menu'];
      else if (screen.breakpoints[Breakpoints.Medium]) return ['select', 'cidr', 'hosts', 'project', 'tags', 'menu'];
      return this.displayedColumns;
    })
  );

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private ipRangesService: IpRangesService,
    private ipRangesInteractor: IpRangesInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:IP ranges list page title|:IP Ranges`);
  }

  buildFilters(stringFilters: string[], tags: Tag[]): any {
    const SEPARATOR = ':';
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const includedTags = [];
    const domains = [];
    const ips = [];
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
        case 'ip':
          if (value) ips.push(value.trim().toLowerCase());
          break;
        case 'tags':
          const tag = tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) includedTags.push(tag._id);
          else
            this.toastr.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
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
    if (ips?.length) filterObject['ips'] = ips;
    if (projects?.length) filterObject['projects'] = projects;
    if (blocked !== null) filterObject['blocked'] = blocked;
    return filterObject;
  }

  openNewIpRangesDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }

  async saveNewIpRanges() {
    if (!this.selectedProject) {
      this.toastr.warning($localize`:Missing project|The data selected is missing the project id:Missing project`);
      return;
    }

    if (this.newIpRanges.length == 0) {
      this.toastr.warning(
        $localize`:Add ip range to save|The data selected is missing the new ip ranges:Add IP ranges before saving`
      );
      return;
    }

    try {
      const addedIpRanges = await this.ipRangesService.add(this.selectedProject, this.newIpRanges);
      this.toastr.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);

      if (addedIpRanges.length < this.newIpRanges.length) {
        this.toastr.warning(
          $localize`:IP ranges not added|Some ip ranges were not added to the database:Some ip ranges were not added`
        );
      }

      this.newIpRanges = [];

      this.dialog.closeAll();
      this.refresh$.next(null);
      this.selectedProject = '';
    } catch (err: any) {
      if (err.status === HttpStatus.BadRequest) {
        this.toastr.error(
          $localize`:Check ip range format|Error while submitting the new ip ranges to the backend. Most likely an ip range formatting error:Error submitting ip ranges, check formats`
        );
      } else {
        throw err;
      }
    }
  }

  dateFilter(event: MouseEvent) {
    console.log('DATE FILTER');
    event.stopPropagation();
    this.startDate = new Date(Date.now() - defaultNewTimeMs);
  }

  public async deleteBatch(ipRanges: IpRange[]) {
    const result = await this.ipRangesInteractor.deleteBatch(ipRanges, this.projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async blockBatch(ipRanges: IpRange[]) {
    const result = await this.ipRangesInteractor.blockBatch(ipRanges, this.projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async block(ipRangeId: string, block: boolean) {
    const result = await this.ipRangesInteractor.block(ipRangeId, block);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public generateMenuItem = (element: IpRange): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.block(element._id, !element.blocked),
      icon: element.blocked ? 'thumb_up ' : 'block',
      label: element.blocked
        ? $localize`:Unblock ip range|Unblock ip range:Unblock`
        : $localize`:Block ip range|Block ip range:Block`,
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete ip range|Delete ip range:Delete`,
    });

    return menuItems;
  };
}
