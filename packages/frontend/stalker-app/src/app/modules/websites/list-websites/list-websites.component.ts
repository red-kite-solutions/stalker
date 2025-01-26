import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, Inject, Injectable } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ParamMap, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, switchMap, tap } from 'rxjs';
import { FindingsService } from '../../../api/findings/findings.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { WebsitesService } from '../../../api/websites/websites.service';
import { ProjectCellComponent } from '../../../shared/components/project-cell/project-cell.component';
import { IntersectionDirective } from '../../../shared/directives/intersection.directive';
import { SharedModule } from '../../../shared/shared.module';
import { CustomFinding, CustomFindingField } from '../../../shared/types/finding/finding.type';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { Tag } from '../../../shared/types/tag.type';
import { Website } from '../../../shared/types/websites/website.type';
import { SecureIconComponent } from '../../../shared/widget/dynamic-icons/secure-icon.component';
import {
  ElementMenuItems,
  FilteredPaginatedTableComponent,
} from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { GridFormatComponent } from '../../../shared/widget/filtered-paginated-table/grid-format/grid-format.component';
import {
  TABLE_FILTERS_SOURCE_INITAL_FILTERS,
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
import { FindingsModule } from '../../findings/findings.module';
import { WebsiteInteractionsService } from '../websites-interactions.service';

type WebsiteWithPreview = Website & { image$: Observable<CustomFindingField | null> };

type ViewStyle = 'grid' | 'table';

interface WebsiteFilters {
  viewStyle: ViewStyle;
  numberOfColumns: number;
}

@Injectable()
class WebsiteFiltersSource extends TableFiltersSourceBase<WebsiteFilters> {
  private readonly VIEW_STYLE_KEY = 's';
  private readonly NUMBER_OF_COLUMNS_KEY = 'c';

  public setViewStyle(style: ViewStyle) {
    if (style == null) return;

    this.setValues({ [this.VIEW_STYLE_KEY]: style });
  }

  public setNumberOfColumns(cols: number) {
    if (cols == null) return;

    this.setValues({ [this.NUMBER_OF_COLUMNS_KEY]: cols });
  }

  protected override extractExtraFilters(params: ParamMap): WebsiteFilters {
    const numberOfColumns = this.readNumber(params.get(this.NUMBER_OF_COLUMNS_KEY)) as number;
    let viewStyle = params.get(this.VIEW_STYLE_KEY) as ViewStyle;
    return {
      numberOfColumns,
      viewStyle,
    };
  }

  protected override formatExtraInitialFilters(initialFilters: WebsiteFilters) {
    if (!initialFilters) return {};

    return {
      [this.VIEW_STYLE_KEY]: initialFilters.viewStyle,
      [this.NUMBER_OF_COLUMNS_KEY]: initialFilters.numberOfColumns,
    };
  }
}

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
    IntersectionDirective,
  ],
  selector: 'app-list-websites',
  templateUrl: './list-websites.component.html',
  styleUrls: ['./list-websites.component.scss'],
  providers: [
    { provide: TableFiltersSourceBase, useClass: WebsiteFiltersSource },
    {
      provide: TABLE_FILTERS_SOURCE_INITAL_FILTERS,
      useValue: {
        filters: ['-is: blocked'],
        pagination: { page: 0, pageSize: 25 },
        numberOfColumns: 3,
        viewStyle: 'grid',
      } as WebsiteFilters,
    },
  ],
})
export class ListWebsitesComponent {
  readonly correlationKeysToLoad: BehaviorSubject<string>[] = [];

  dataLoading = true;
  displayedColumns: string[] = ['select', 'url', 'domain', 'port', 'ip', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['domain', 'host', 'port', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No website found|No website was found:No website found`;

  selection = new SelectionModel<WebsiteWithPreview>(true, []);
  startDate: Date | null = null;
  public readonly gridColumnsOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

  allTags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  refresh$ = new BehaviorSubject(null);
  websites$ = combineLatest([
    this.filtersSource.debouncedFilters$,
    this.allTags$,
    this.refresh$,
    globalProjectFilter$,
  ]).pipe(
    switchMap(([{ filters, dateRange, pagination }, tags]) =>
      this.websitesService.getPage(
        pagination?.page ?? 0,
        pagination?.pageSize ?? 25,
        this.buildFilters(filters, tags),
        dateRange
      )
    ),
    tap(() => (this.dataLoading = false)),
    shareReplay(1)
  );

  dataSource$ = this.websites$.pipe(
    map((websites) => websites.items.map((website) => ({ ...website, image$: this.getImage$(website) }))),
    map((x) => new MatTableDataSource<WebsiteWithPreview>(x))
  );

  public viewStyle$ = this.filtersSource.debouncedFilters$.pipe(map((x) => x.viewStyle));
  public numberOfColumns$ = this.filtersSource.debouncedFilters$.pipe(map((x) => x.numberOfColumns));

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
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'url', 'project', 'menu'];
      else if (screen.breakpoints[Breakpoints.Small])
        return ['select', 'url', 'domain', 'port', 'ip', 'project', 'tags', 'menu'];
      else if (screen.breakpoints[Breakpoints.Medium])
        return ['select', 'url', 'domain', 'port', 'ip', 'project', 'tags', 'menu'];
      return this.displayedColumns;
    })
  );

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private websitesService: WebsitesService,
    private websitesInteractor: WebsiteInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title,
    private findingsService: FindingsService,
    @Inject(TableFiltersSourceBase) public filtersSource: WebsiteFiltersSource
  ) {
    this.titleService.setTitle($localize`:Websites list page title|:Websites`);
  }

  buildFilters(stringFilters: string[], tags: Tag[]): any {
    const SEPARATOR = ':';
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const includedTags = [];
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
            case 'merged':
              merged = !negated;
              break;
          }
          break;
      }
    }

    if (hasGlobalProjectFilter()) projects.push(getGlobalProjectFilter()?.id);

    if (includedTags?.length) filterObject['tags'] = includedTags;
    if (ports?.length) filterObject['ports'] = ports;
    if (hosts?.length) filterObject['hosts'] = hosts;
    if (domains?.length) filterObject['domains'] = domains;
    if (projects?.length) filterObject['projects'] = projects;
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
      this.refresh$.next(null);
    }
  }

  public async blockBatch(websites: Website[]) {
    const result = await this.websitesInteractor.blockBatch(websites, this.projects);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  public async block(websiteId: string, block: boolean) {
    const result = await this.websitesInteractor.block(websiteId, block);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
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
      this.refresh$.next(null);
    }
  }

  private async unmerge(id: string) {
    const result = await this.websitesInteractor.unmerge(id);
    if (result) {
      this.selection.clear();
      this.refresh$.next(null);
    }
  }

  private getImage$(website: Website) {
    return this.findingsService.getLatestWebsitePreview(website.correlationKey).pipe(
      map((finding: CustomFinding) => {
        const image = finding?.fields.find((f) => f.key === 'image' && f.type === 'image' && !!f.data);
        if (image) return image;

        return null;
      }),
      shareReplay(1)
    );
  }
}
