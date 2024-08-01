import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
import { ProjectsService } from 'src/app/api/projects/projects.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { ProjectCellComponent } from 'src/app/shared/components/project-cell/project-cell.component';
import { Page } from 'src/app/shared/types/page.type';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import { Tag } from 'src/app/shared/types/tag.type';
import {
  ElementMenuItems,
  FilteredPaginatedTableComponent,
} from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { BlockedPillTagComponent } from 'src/app/shared/widget/pill-tag/blocked-pill-tag.component';
import { PortsService } from '../../../api/ports/ports.service';
import { SharedModule } from '../../../shared/shared.module';
import { Port } from '../../../shared/types/ports/port.interface';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { defaultNewTimeMs } from '../../../shared/widget/pill-tag/new-pill-tag.component';
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
  ],
  selector: 'app-list-ports',
  templateUrl: './list-ports.component.html',
  styleUrls: ['./list-ports.component.scss'],
})
export class ListPortsComponent {
  dataLoading = true;
  displayedColumns: string[] = ['select', 'port', 'ip', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['host', 'port', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No port found|No port was found:No port found`;

  dataSource = new MatTableDataSource<Port>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = ['-is: blocked'];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  count = 0;
  selection = new SelectionModel<Port>(true, []);
  currentDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  startDate: Date | null = null;

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.portsService.getPage<Port>(
        currentPage.pageIndex,
        currentPage.pageSize,
        filters,
        this.currentDateRange,
        'full'
      );
    }),
    map((data: Page<Port>) => {
      this.dataSource = new MatTableDataSource<Port>(data.items);
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
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'port', 'ip', 'project', 'menu'];
      else if (screen.breakpoints[Breakpoints.Small]) return ['select', 'port', 'ip', 'project', 'tags', 'menu'];
      else if (screen.breakpoints[Breakpoints.Medium]) return ['select', 'port', 'ip', 'project', 'tags', 'menu'];
      return this.displayedColumns;
    })
  );

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
  }

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private portsService: PortsService,
    private portsInteractor: PortsInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Ports list page title|:Ports`);
  }

  filtersChange(filters: string[]) {
    this.currentFilters = filters;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
  }

  dateRangeFilterChange(range: DateRange<Date>) {
    this.currentDateRange = range;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
  }

  buildFilters(stringFilters: string[]): any {
    const SEPARATOR = ':';
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const tags = [];
    const ports = [];
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
          const tag = this.tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) tags.push(tag._id);
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
    if (tags?.length) filterObject['tags'] = tags;
    if (ports?.length) filterObject['ports'] = ports;
    if (hosts?.length) filterObject['host'] = hosts;
    if (projects?.length) filterObject['project'] = projects;
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
      this.currentPage$.next(this.currentPage);
    }
  }

  public async blockBatch(domains: Port[]) {
    const result = await this.portsInteractor.blockBatch(domains, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public async block(domainId: string, block: boolean) {
    const result = await this.portsInteractor.block(domainId, block);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
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
