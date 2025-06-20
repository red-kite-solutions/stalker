import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
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
import {
  AutocompleteBuilder,
  excludeSuggestion,
  hostSuggestion,
  ipRangeSuggestion,
  isSuggestion,
  projectSuggestion,
  tagSuggestion,
} from '@red-kite/frontend/app/shared/widget/filtered-paginated-table/autocomplete';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, catchError, combineLatest, EMPTY, map, shareReplay, switchMap, tap } from 'rxjs';
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
    PillTagComponent,
  ],
  selector: 'app-list-ip-ranges',
  templateUrl: './list-ip-ranges.component.html',
  styleUrls: ['./list-ip-ranges.component.scss'],
  providers: [
    { provide: TableFiltersSourceBase, useClass: TableFiltersSource },
    {
      provide: TABLE_FILTERS_SOURCE_INITAL_FILTERS,
      useValue: {
        filters: ['-is:blocked '],
        pagination: { page: 0, pageSize: 25 },
      } as TableFilters,
    },
  ],
})
export class ListIpRangesComponent {
  public readonly autocomplete = this.autocompleteBuilder
    .build('key')
    .suggestion(ipRangeSuggestion)
    .suggestion(hostSuggestion)
    .suggestion(tagSuggestion)
    .suggestion(projectSuggestion)
    .suggestion(isSuggestion)
    .divider()
    .suggestion(excludeSuggestion);

  dataLoading = true;
  displayedColumns: string[] = ['select', 'cidr', 'hosts', 'project', 'tags', 'menu'];
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
    switchMap(([{ dateRange, filters, pagination }, tags]) =>
      this.ipRangesService
        .getPage(
          pagination?.page || 0,
          pagination?.pageSize || 25,
          appendGlobalFiltersToQuery(filters[0]),
          dateRange ?? new DateRange<Date>(null, null)
        )
        .pipe(catchError(() => EMPTY))
    ),
    map((data: Page<IpRange>) => {
      this.count = data.totalRecords;
      this.dataLoading = false;
      return new MatTableDataSource<IpRange>(data.items);
    }),
    shareReplay(1)
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
    private autocompleteBuilder: AutocompleteBuilder,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:IP ranges list page title|:IP Ranges`);
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
          $localize`:IP ranges duplicates|Some ip ranges were duplicates to the database:Some ip ranges were duplicates`
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
