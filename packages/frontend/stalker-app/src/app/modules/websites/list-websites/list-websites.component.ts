import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { DateRange } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, map, Observable, shareReplay, switchMap, tap } from 'rxjs';
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
import { FindingsService } from '../../../api/findings/findings.service';
import { WebsitesService } from '../../../api/websites/websites.service';
import { ObserverChildDirective } from '../../../shared/directives/observer-child.directive';
import { SharedModule } from '../../../shared/shared.module';
import { CustomFinding, CustomFindingField } from '../../../shared/types/finding/finding.type';
import { Website } from '../../../shared/types/websites/website.type';
import { SecureIconComponent } from '../../../shared/widget/dynamic-icons/secure-icon.component';
import { GridFormatComponent } from '../../../shared/widget/filtered-paginated-table/grid-format/grid-format.component';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { defaultNewTimeMs } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { FindingsModule } from '../../findings/findings.module';
import { WebsiteInteractionsService } from '../websites-interactions.service';

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
    MatDividerModule,
    MatButtonToggleModule,
    TableFormatComponent,
    GridFormatComponent,
    SecureIconComponent,
    MatCardModule,
    MatProgressSpinnerModule,
    FindingsModule,
    ObserverChildDirective,
  ],
  selector: 'app-list-websites',
  templateUrl: './list-websites.component.html',
  styleUrls: ['./list-websites.component.scss'],
})
export class ListWebsitesComponent {
  readonly correlationKeysToLoad: BehaviorSubject<string>[] = [];

  readonly observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        let wsite: Website | undefined = undefined;

        const id = entry.target.id;

        if (this.imageLoading[id] || this.images$[id]) continue;

        const index = this.dataSource.data.findIndex((w) => w._id === id);
        if (index < 0) continue;

        wsite = this.dataSource.data[index];

        if (!wsite) continue;

        this.imageLoading[wsite._id] = true;
        this.images$[wsite._id] = this.findingsService.getLatestWebsitePreview(wsite.correlationKey).pipe(
          map((finding: CustomFinding) => {
            if (!finding) return null;

            const index = finding.fields.findIndex((f) => f.key === 'image' && f.type === 'image' && !!f.data);

            if (index < 0) return null;

            return finding.fields[index];
          }),
          tap(() => {
            this.imageLoading[wsite!._id] = false;
          }),
          shareReplay(1)
        );
      }
    }
  });

  dataLoading = true;
  displayedColumns: string[] = ['select', 'url', 'domain', 'port', 'ip', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['domain', 'host', 'port', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No website found|No website was found:No website found`;

  dataSource = new MatTableDataSource<Website>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = ['-is: blocked', '-is: merged'];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  count = 0;
  selection = new SelectionModel<Website>(true, []);
  currentDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  startDate: Date | null = null;
  public readonly gridColumnsOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
  public viewStyle: 'table' | 'grid' = 'table';
  public _gridColumnsCount = 3;
  public set gridColumnsCount(v: number) {
    this._gridColumnsCount = v;
  }
  public get gridColumnsCount() {
    return this._gridColumnsCount;
  }

  public imageLoading: { [id: string]: boolean } = {};
  public images$: { [id: string]: Observable<CustomFindingField | null> } = {};

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.websitesService.getPage(currentPage.pageIndex, currentPage.pageSize, filters, this.currentDateRange);
    }),
    tap((data: Page<Website>) => {
      this.dataSource = new MatTableDataSource<Website>(data.items);
      this.count = data.totalRecords;
      this.dataLoading = false;
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
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'url', 'project', 'menu'];
      else if (screen.breakpoints[Breakpoints.Small])
        return ['select', 'url', 'domain', 'port', 'ip', 'project', 'tags', 'menu'];
      else if (screen.breakpoints[Breakpoints.Medium])
        return ['select', 'url', 'domain', 'port', 'ip', 'project', 'tags', 'menu'];
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
    private websitesService: WebsitesService,
    private websitesInteractor: WebsiteInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title,
    private findingsService: FindingsService
  ) {
    this.titleService.setTitle($localize`:Websites list page title|:Websites`);
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
    const domains = [];
    const projects = [];
    let blocked: boolean | null = null;
    let merged: boolean | null = null;

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
        case 'domain':
          if (value) domains.push(value.trim().toLowerCase());
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
            case 'merged':
              merged = !negated;
              break;
          }
          break;
      }
    }
    if (tags?.length) filterObject['tags'] = tags;
    if (ports?.length) filterObject['ports'] = ports;
    if (hosts?.length) filterObject['hosts'] = hosts;
    if (domains?.length) filterObject['domains'] = domains;
    if (projects?.length) filterObject['project'] = projects;
    if (blocked !== null) filterObject['blocked'] = blocked;
    if (merged !== null) filterObject['merged'] = merged;
    return filterObject;
  }

  dateFilter(event: MouseEvent) {
    event.stopPropagation();
    this.startDate = new Date(Date.now() - defaultNewTimeMs);
  }

  public async deleteBatch(websites: Website[]) {
    const result = await this.websitesInteractor.deleteBatch(websites, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public async blockBatch(websites: Website[]) {
    const result = await this.websitesInteractor.blockBatch(websites, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public async block(websiteId: string, block: boolean) {
    const result = await this.websitesInteractor.block(websiteId, block);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public generateMenuItem = (element: Website): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.block(element._id, !element.blocked),
      icon: element.blocked ? 'thumb_up ' : 'block',
      label: element.blocked
        ? $localize`:Unblock website|Unblock website:Unblock`
        : $localize`:Block website|Block website:Block`,
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete website|Delete website:Delete`,
    });

    menuItems.push({
      action: () => this.unmerge(element._id),
      icon: 'call_split',
      label: $localize`:Unmerge|Unmerge websites that were previously merged together:Unmerge`,
      hidden: !element.mergedInId,
    });

    return menuItems;
  };

  public async merge(websites: Website[]) {
    const result = await this.websitesInteractor.merge(websites, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  private async unmerge(id: string) {
    const result = await this.websitesInteractor.unmerge(id);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }
}
